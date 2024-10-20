import { Kysely, PostgresDialect } from "kysely";
import { jsonArrayFrom } from "kysely/helpers/postgres";
import Pg from "pg";
import Database from "./schemas/Database.js";
import { Account, AccountId } from "./schemas/public/Account.js";
import { Session, SessionId } from "./schemas/public/Session.js";
import { getEnv, hashPassword } from "./util.js";
import { createId } from "@paralleldrive/cuid2";
import { AppError } from "./error.js";
import { PasswordId } from "./schemas/public/Password.js";
import { Article, ArticleId } from "./schemas/public/Article.js";
import { FeedLog, FeedLogId } from "./schemas/public/FeedLog.js";
import { Feed, FeedId } from "./schemas/public/Feed.js";
import { downloadFeed } from "./feed.js";
import {
	AddFeedGroupRequest,
	AddFeedRequest,
	AddGroupFeedRequest,
	ArticleSummary,
	FeedGroupWithFeeds,
	FeedStat,
	FeedStats,
	UpdateFeedRequest,
} from "@jason0x43/reader-types";
import { FeedGroup, FeedGroupId } from "./schemas/public/FeedGroup.js";
import { encodeHexLowerCase } from "@oslojs/encoding";

export class Db {
	#db: Kysely<Database>;

	constructor() {
		const dbUser = getEnv("POSTGRES_USER");
		const dbPassword = encodeURIComponent(getEnv("POSTGRES_PASSWORD"));
		const dbName = getEnv("POSTGRES_DB");
		const dbHost = getEnv("POSTGRES_HOST");
		const dbPort = getEnv("POSTGRES_PORT");
		const dbUrl = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

		this.#db = new Kysely({
			dialect: new PostgresDialect({
				pool: new Pg.Pool({
					connectionString: dbUrl,
				}),
			}),
		});
	}

	get db(): Kysely<Database> {
		return this.#db;
	}

	async getAccounts(): Promise<Account[]> {
		return await this.#db.selectFrom("account").selectAll().execute();
	}

	async getAccount(id: AccountId): Promise<Account> {
		return await this.#db
			.selectFrom("account")
			.selectAll()
			.where("id", "=", id)
			.executeTakeFirstOrThrow(
				() => new AppError(`user with id ${id} not found`),
			);
	}

	async getAccountByUsername(username: string): Promise<Account> {
		return await this.#db
			.selectFrom("account")
			.selectAll()
			.where("username", "=", username)
			.executeTakeFirstOrThrow(
				() => new AppError(`user ${username} not found`),
			);
	}

	async addAccount(
		email: string,
		username: string,
		password: string,
	): Promise<Account> {
		return await this.#db.transaction().execute(async (tx) => {
			const account = await tx
				.insertInto("account")
				.values({
					id: createId() as AccountId,
					email,
					username,
				})
				.returningAll()
				.executeTakeFirstOrThrow();

			const pw = hashPassword(password);

			await tx
				.insertInto("password")
				.values({
					id: createId() as PasswordId,
					account_id: account.id,
					salt: pw.salt,
					hash: pw.hash,
				})
				.execute();

			return account;
		});
	}

	async setAccountPassword(account: Account, password: string): Promise<void> {
		const pw = hashPassword(password);
		await this.#db
			.insertInto("password")
			.values({
				id: createId() as PasswordId,
				account_id: account.id,
				salt: pw.salt,
				hash: pw.hash,
			})
			.onConflict((oc) =>
				oc.column("account_id").doUpdateSet({
					salt: pw.salt,
					hash: pw.hash,
				}),
			)
			.execute();
	}

	async validatePassword(account: Account, password: string): Promise<void> {
		console.debug(`validating password for ${account.username}`);

		const pw = await this.#db
			.selectFrom("password")
			.select(["hash", "salt"])
			.where("account_id", "=", account.id)
			.executeTakeFirstOrThrow(() =>
				Error(`password for ${account.username} not found`),
			);

		const hash = hashPassword(password, pw.salt);

		if (hash.hash !== pw.hash) {
			throw new Error("Invalid password");
		}
	}

	async addSession(
		account: Account,
		token: string,
		expires?: Date,
	): Promise<Session> {
		console.debug(`creating session for ${account.username}`);
		expires = expires ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		const sessionId = await tokenToSessionId(token);

		return await this.#db
			.insertInto("session")
			.values({
				id: sessionId as SessionId,
				account_id: account.id,
				expires,
			})
			.returningAll()
			.executeTakeFirstOrThrow(
				() => new AppError(`unable to create session for ${account.username}`),
			);
	}

	async getSession(sessionId: SessionId): Promise<Session> {
		const session = await this.#db
			.selectFrom("session")
			.selectAll()
			.where("id", "=", sessionId)
			.executeTakeFirstOrThrow(
				() => new AppError(`no session for id ${sessionId}`),
			);

		return session;
	}

	async deleteSession(sessionId: SessionId): Promise<void> {
		await this.#db.deleteFrom("session").where("id", "=", sessionId).execute();
	}

	async extendSession(token: string): Promise<Session | null> {
		const sessionId = await tokenToSessionId(token);
		const session = await this.getSession(sessionId);

		// If the session is expired, delete it
		if (Date.now() >= session.expires.getTime()) {
			this.#db.deleteFrom("session").where("id", "=", sessionId);
			return null;
		}

		// Extend the token's lifetime
		session.expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		await this.#db.updateTable("session").set(session).execute();

		return session;
	}

	/**
	 * Check that a session token points to a live session
	 */
	async validateSessionToken(token: string): Promise<SessionValidationResult> {
		const sessionId = await tokenToSessionId(token);
		const session = await this.getSession(sessionId);
		const account = await this.getAccount(session.account_id);

		// If the session is expired, remove it
		if (Date.now() >= session.expires.getTime()) {
			console.debug(`Removing expired session for ${token}`);
			this.#db.deleteFrom("session").where("id", "=", sessionId);
			return { session: null, account: null };
		}

		// If the session is old, refresh it
		if (Date.now() >= session.expires.getTime() - 1000 * 60 * 60 * 24 * 15) {
			console.debug(`Refreshing session for ${token}`);
			await this.#db
				.updateTable("session")
				.set({
					expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
				})
				.where("id", "=", sessionId)
				.execute();
		}

		return { session, account: account };
	}

	async invalidateSession(token: string): Promise<void> {
		const sessionId = await tokenToSessionId(token);
		await this.deleteSession(sessionId);
	}

	async getArticles(
		account: Account,
		options?: { saved?: boolean },
	): Promise<
		(Omit<Article, "content"> & {
			read: boolean | null;
			saved: boolean | null;
		})[]
	> {
		let query = this.#db
			.selectFrom("article")
			.innerJoin("feed", "feed.id", "article.feed_id")
			.innerJoin("feed_group", (join) =>
				join.on("feed_group.account_id", "=", account.id),
			)
			.innerJoin("feed_group_feed", (join) =>
				join
					.onRef("feed_group_feed.feed_id", "=", "feed.id")
					.onRef("feed_group_feed.feed_group_id", "=", "feed_group.id"),
			)
			.leftJoin("account_article", "account_article.article_id", "article.id")
			.select([
				"article.id",
				"article.article_id",
				"article.feed_id",
				"article.title",
				"article.published",
				"article.link",
				"read",
				"saved",
			])
			.where("account_article.account_id", "=", account.id);

		if (options?.saved) {
			query = query.where("saved", "=", true);
		}

		return await query.orderBy("published", "asc").execute();
	}

	async getArticle(id: ArticleId): Promise<Article> {
		return this.#db
			.selectFrom("article")
			.selectAll()
			.where("id", "=", id)
			.executeTakeFirstOrThrow(
				() => new AppError(`article with id ${id} not found`),
			);
	}

	async markArticles(
		account: Account,
		articleIds: ArticleId[],
		options?: { saved?: boolean; read?: boolean },
	): Promise<void> {
		const values = articleIds.map((id) => ({
			account_id: account.id,
			article_id: id,
			read: options?.read,
			saved: options?.saved,
		}));

		await this.#db
			.insertInto("account_article")
			.values(values)
			.onConflict((conflict) =>
				conflict.columns(["article_id", "account_id"]).doUpdateSet({
					read: options?.read,
					saved: options?.saved,
				}),
			)
			.execute();
	}

	async getFeedLogs(): Promise<FeedLog[]> {
		return this.#db.selectFrom("feed_log").selectAll().execute();
	}

	async getFeedLog(feedId: FeedId): Promise<FeedLog[]> {
		return this.#db
			.selectFrom("feed_log")
			.selectAll()
			.where("feed_id", "=", feedId)
			.execute();
	}

	/**
	 * Refresh a feed
	 */
	async refreshFeed(feed: Feed) {
		try {
			console.debug(`Refreshing feed ${feed.title}`);

			const downloadedFeed = await downloadFeed(feed.url);

			if (downloadedFeed.icon) {
				try {
					await this.#db
						.updateTable("feed")
						.set({ icon: downloadedFeed.icon })
						.where("id", "=", feed.id)
						.executeTakeFirst();
					console.debug(`Updated icon for ${feed.title}`);
				} catch (error) {
					console.warn(`Error updating icon for ${feed.title}: ${error}`);
				}
			}

			for (const article of downloadedFeed.articles) {
				try {
					await this.#db
						.insertInto("article")
						.values({
							id: createId() as ArticleId,
							feed_id: feed.id,
							...article,
						})
						.onConflict((conflict) =>
							conflict.columns(["article_id", "feed_id"]).doUpdateSet({
								content: article.content,
								title: article.title,
								link: article.link,
								published: article.published,
							}),
						)
						.execute();
					console.log(`Inserted article ${article.article_id}`);
				} catch (error) {
					console.warn(
						`Error inserted article ${article.article_id}: ${error}`,
					);
				}
			}

			console.debug(`Processed feed ${feed.title}`);

			await this.#db
				.insertInto("feed_log")
				.values({
					id: createId() as FeedLogId,
					feed_id: feed.id,
					time: new Date(),
					success: true,
				})
				.execute();
		} catch (error) {
			console.warn(`Error downloading feed ${feed.url}: ${error}`);
			await this.#db
				.insertInto("feed_log")
				.values({
					id: createId() as FeedLogId,
					feed_id: feed.id,
					time: new Date(),
					success: false,
					message: `${error}`,
				})
				.execute();
		}
	}

	/**
	 * Refresh all active feeds
	 *
	 * Check that it's been at least minDelayMs milliseconds since the last
	 * update for each feed.
	 */
	async refreshActiveFeeds(minDelayMs: number) {
		console.log("Refreshing feeds...");
		const activeFeeds = await this.getActiveFeeds();
		const now = new Date();

		await Promise.all(
			activeFeeds.map(async (feed) => {
				const lastUpdate = await this.getLastUpdate(feed.id);
				console.debug(`Last update for ${feed.title}: ${lastUpdate}`);
				if (!lastUpdate || now.getTime() - lastUpdate.getTime() >= minDelayMs) {
					return this.refreshFeed(feed);
				}
				console.debug(`Skipping feed ${feed.title}`);
			}),
		);

		console.log("Finished refreshing feeds");
	}

	/**
	 * Get a feed
	 */
	async getFeed(feedId: FeedId): Promise<Feed> {
		return await this.#db
			.selectFrom("feed")
			.selectAll()
			.where("id", "=", feedId)
			.executeTakeFirstOrThrow();
	}

	/**
	 * Delete a feed
	 */
	async deleteFeed(feedId: FeedId): Promise<void> {
		await this.#db.deleteFrom("feed").where("id", "=", feedId).execute();
	}

	/**
	 * Get all the feeds
	 */
	async getFeeds(): Promise<Feed[]> {
		return this.#db.selectFrom("feed").selectAll().execute();
	}

	/**
	 * Get all the feeds with active subscriptions
	 */
	async getActiveFeeds(): Promise<Feed[]> {
		const feedGroupFeedIds = await this.#db
			.selectFrom("feed_group_feed")
			.select(["feed_id"])
			.distinct()
			.execute();
		const feedIds = feedGroupFeedIds.map(({ feed_id }) => feed_id);
		return this.#db
			.selectFrom("feed")
			.innerJoin("feed_group_feed", "feed_group_feed.feed_id", "feed.id")
			.selectAll()
			.distinct()
			.where((eb) => eb("id", "=", eb.fn.any(eb.val(feedIds))))
			.execute();
	}

	async getFeedArticles(feedId: FeedId): Promise<ArticleSummary[]> {
		const articles = await this.#db
			.selectFrom("article")
			.leftJoin("account_article", "account_article.article_id", "article.id")
			.select([
				"article.id",
				"article.article_id",
				"feed_id",
				"title",
				"published",
				"link",
				"read",
				"saved",
			])
			.where("feed_id", "=", feedId)
			.orderBy("published", "asc")
			.execute();

		return articles.map((article) => ({
			...article,
			published: article.published.toISOString(),
		}));
	}

	async getFeedStat(userId: AccountId, feedId: FeedId): Promise<FeedStat> {
		const { total } = await this.#db
			.selectFrom("article")
			.select((eb) => eb.fn.countAll().as("total"))
			.where("feed_id", "=", feedId)
			.executeTakeFirstOrThrow();

		const { read } = await this.#db
			.selectFrom("account_article")
			.innerJoin("article", "article.id", "account_article.article_id")
			.select((eb) => eb.fn.countAll().as("read"))
			.where("account_article.account_id", "=", userId)
			.where("account_article.read", "=", true)
			.where("article.feed_id", "=", feedId)
			.executeTakeFirstOrThrow();

		const { saved } = await this.#db
			.selectFrom("account_article")
			.innerJoin("article", "article.id", "account_article.article_id")
			.select((eb) => eb.fn.countAll().as("saved"))
			.where("account_article.account_id", "=", userId)
			.where("account_article.saved", "=", true)
			.where("article.feed_id", "=", feedId)
			.executeTakeFirstOrThrow();

		return {
			total: Number(total),
			read: Number(read),
			saved: Number(saved),
		};
	}

	async getFeedStats(userId: AccountId): Promise<FeedStats> {
		const rows = await this.#db
			.selectFrom("article")
			.innerJoin("feed", "feed.id", "article.feed_id")
			.innerJoin("feed_group_feed", "feed_group_feed.feed_id", "feed.id")
			.innerJoin("feed_group", "feed_group.id", "feed_group_id")
			.leftJoin("account_article", "account_article.article_id", "article.id")
			.select((eb) => [
				"feed.id as id",
				"account_article.read as read",
				"account_article.saved as saved",
				eb.fn.countAll().as("count"),
			])
			.where("feed_group.account_id", "=", userId)
			.groupBy(["feed.id", "account_article.read", "account_article.saved"])
			.execute();

		const stats: FeedStats = {};

		for (const row of rows) {
			const { id, read, saved, count } = row;
			if (!stats[id]) {
				stats[id] = { total: 0, read: 0, saved: 0 };
			}

			// the pg driver sometimes/always returns strings for
			// count/countAll
			const countNum = Number(count);

			stats[id].total += countNum;
			stats[id].read += read ? countNum : 0;
			stats[id].saved += saved ? countNum : 0;
		}

		return stats;
	}

	async updateFeed(feedId: FeedId, data: UpdateFeedRequest): Promise<Feed> {
		return await this.#db
			.updateTable("feed")
			.set(data)
			.where("id", "=", feedId)
			.returningAll()
			.executeTakeFirstOrThrow();
	}

	async addFeed(data: AddFeedRequest): Promise<Feed> {
		return await this.#db
			.insertInto("feed")
			.values({
				id: createId() as FeedId,
				disabled: false,
				kind: "rss",
				...data,
			})
			.returningAll()
			.executeTakeFirstOrThrow();
	}

	async getFeedGroups(userId: AccountId): Promise<FeedGroupWithFeeds[]> {
		const groups = await this.#db
			.selectFrom("feed_group")
			.select((eb) => [
				"id",
				"account_id",
				"name",
				jsonArrayFrom(
					eb
						.selectFrom("feed_group_feed")
						.select("feed_id")
						.whereRef("feed_group_id", "=", "feed_group.id"),
				).as("feed_ids"),
			])
			.where("account_id", "=", userId)
			.execute();

		return groups.map((group) => ({
			...group,
			feed_ids: group.feed_ids.map(({ feed_id }) => feed_id),
		}));
	}

	async addFeedGroup(
		userId: AccountId,
		data: AddFeedGroupRequest,
	): Promise<FeedGroup> {
		return await this.#db
			.insertInto("feed_group")
			.values({
				id: createId() as FeedGroupId,
				account_id: userId,
				...data,
			})
			.returningAll()
			.executeTakeFirstOrThrow();
	}

	async getFeedGroup(
		userId: AccountId,
		feedGroupId: FeedGroupId,
	): Promise<FeedGroup> {
		return await this.#db
			.selectFrom("feed_group")
			.selectAll()
			.where("id", "=", feedGroupId)
			.where("account_id", "=", userId)
			.executeTakeFirstOrThrow();
	}

	async removeFeedFromAllGroups(
		userId: AccountId,
		feedId: FeedId,
	): Promise<void> {
		await this.#db
			.deleteFrom("feed_group_feed")
			.using("feed_group")
			.where("feed_id", "=", feedId)
			.where("account_id", "=", userId)
			.whereRef("feed_group.id", "=", "feed_group_feed.feed_group_id")
			.execute();
	}

	async addGroupFeed(
		userId: AccountId,
		feedGroupId: FeedGroupId,
		data: AddGroupFeedRequest,
	): Promise<FeedGroupWithFeeds> {
		// Verify that the user owns this feed group
		const group = await this.getFeedGroup(userId, feedGroupId);

		return await this.#db.transaction().execute(async (tx) => {
			await tx
				.insertInto("feed_group_feed")
				.values({
					feed_id: data.feed_id as FeedId,
					feed_group_id: feedGroupId,
				})
				.execute();

			if (data.move_feed) {
				await tx
					.deleteFrom("feed_group_feed")
					.using("feed_group")
					.where("feed_id", "=", data.feed_id as FeedId)
					.where("account_id", "=", userId)
					.where("feed_group_id", "<>", feedGroupId)
					.whereRef("feed_group.id", "=", "feed_group_feed.feed_group_id")
					.execute();
			}

			const feedIdResults = await tx
				.selectFrom("feed")
				.innerJoin("feed_group_feed", "feed_group_feed.feed_id", "feed.id")
				.select("id")
				.where("feed_group_id", "=", feedGroupId)
				.execute();
			const feedIds = feedIdResults.map(({ id }) => id);

			return {
				...group,
				feed_ids: feedIds,
			};
		});
	}

	async getFeedGroupArticles(
		userId: AccountId,
		feedGroupId: FeedGroupId,
	): Promise<ArticleSummary[]> {
		const articles = await this.#db
			.selectFrom("article")
			.innerJoin("feed", "feed.id", "article.feed_id")
			.innerJoin("feed_group_feed", (join) =>
				join.onRef("feed_group_feed.feed_id", "=", "feed.id"),
			)
			.innerJoin("feed_group", (join) =>
				join
					.onRef("feed_group.id", "=", "feed_group_feed.feed_group_id")
					.on("feed_group.account_id", "=", userId),
			)
			.leftJoin("account_article", "account_article.article_id", "article.id")
			.select([
				"article.id",
				"article.article_id",
				"article.feed_id",
				"article.title",
				"article.published",
				"article.link",
				"read",
				"saved",
			])
			.where("feed_group.id", "=", feedGroupId)
			.orderBy("published", "asc")
			.execute();

		return articles.map((article) => ({
			...article,
			published: article.published.toISOString(),
		}));
	}

	async removeFeedFromGroup(
		userId: AccountId,
		feedGroupId: FeedGroupId,
		feedId: FeedId,
	): Promise<void> {
		await this.#db
			.deleteFrom("feed_group_feed")
			.innerJoin("feed_group", (join) =>
				join.on("feed_group.account_id", "=", userId),
			)
			.where("feed_id", "=", feedId)
			.where("feed_group_id", "=", feedGroupId)
			.execute();
	}

	async getLastUpdate(feedId?: FeedId): Promise<Date | undefined> {
		let lastUpdateQuery = this.#db.selectFrom("feed_log");

		if (feedId) {
			lastUpdateQuery = lastUpdateQuery.where("feed_id", "=", feedId);
		}

		const lastUpdate = await lastUpdateQuery
			.selectAll()
			.orderBy("time", "desc")
			.limit(1)
			.executeTakeFirst();

		return lastUpdate?.time;
	}
}

export type SessionValidationResult =
	| { session: Session; account: Account }
	| { session: null; account: null };

async function tokenToSessionId(token: string): Promise<SessionId> {
	const hashBuf = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(token),
	);
	return encodeHexLowerCase(new Uint8Array(hashBuf)) as SessionId;
}
