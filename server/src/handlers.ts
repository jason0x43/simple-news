import {
	AddFeedGroupRequest,
	AddFeedRequest,
	AddGroupFeedRequest,
	CreateAccountRequest,
	MarkArticleRequest,
	MarkArticlesRequest,
	PasswordLoginRequest,
	SessionResponse,
	UpdateFeedRequest,
} from "@jason0x43/reader-types";
import type { UserRouteHandler } from "./server.js";
import { ArticleId } from "./schemas/public/Article.js";
import { FeedId } from "./schemas/public/Feed.js";
import { AppError } from "./error.js";
import { FeedGroupId } from "./schemas/public/FeedGroup.js";
import { downloadFeed } from "./feed.js";
import { generateSessionToken } from "./util.js";

type Handler = UserRouteHandler;

export default {
	getSessionUser: async (req, res) => {
		const { account } = req.locals;
		res.json(account);
	},

	createUser: async (req, res) => {
		const data = CreateAccountRequest.parse(await req.json());
		const { db } = req.app.locals;
		const account = await db.addAccount(
			data.email,
			data.username,
			data.password,
		);
		res.json(account);
	},

	getUsers: async (_req, res) => {
		const { db } = res.app.locals;
		const users = await db.getAccounts();
		res.json(users);
	},

	/**
	 * Create a session for a account, logging them in.
	 */
	createSession: async (req, res) => {
		console.log("Creating session...");
		try {
			const { db } = req.app.locals;

			const data = PasswordLoginRequest.parse(await req.json());
			const user = await db.getAccountByUsername(data.username);
			await db.validatePassword(user, data.password);

			const token = generateSessionToken();
			const session = await db.addSession(user, token);

			res.send(
				JSON.stringify({
					sessionId: token,
					expires: session.expires,
				} satisfies SessionResponse),
			);
		} catch (error) {
			console.warn(`Error creating session: ${error}`);
			res.status(401).send("Unauthorized");
		}
	},

	/**
	 * Delete a account session, logging out the account
	 */
	deleteSession: async (req, res) => {
		const session = req.locals.session;
		if (session) {
			const { db } = res.app.locals;
			await db.deleteSession(session!.id);
			res.setCookie("session", "").send();
		}
	},

	getArticles: async (req, res) => {
		const { db } = req.app.locals;
		const { account } = req.locals;
		const saved = req.query.saved === "true";
		const articles = await db.getArticles(account!, { saved });
		res.json(articles);
	},

	markArticles: async (req, res) => {
		const { db } = req.app.locals;
		const { account } = req.locals;
		const data = MarkArticlesRequest.parse(await req.json());
		await db.markArticles(account!, data.articleIds as ArticleId[], data.mark);
		res.send("OK");
	},

	getArticle: async (req, res) => {
		const { db } = req.app.locals;
		const articleId = req.params.id as ArticleId;

		try {
			const article = await db.getArticle(articleId);
			res.json(article);
		} catch {
			throw new AppError(`Article ${articleId} not found`, 404);
		}
	},

	markArticle: async (req, res) => {
		const { db } = req.app.locals;
		const { account } = req.locals;
		const articleId = req.params.articleId as ArticleId;
		const data = MarkArticleRequest.parse(await req.json());
		await db.markArticles(account!, [articleId] as ArticleId[], data.mark);
		res.send("OK");
	},

	getFeedLogs: async (req, res) => {
		const { db } = req.app.locals;
		const logs = await db.getFeedLogs();
		res.json(logs);
	},

	refreshFeeds: async (req, res) => {
		const { db } = req.app.locals;
		const feeds = await db.getActiveFeeds();
		await Promise.all(feeds.map((feed) => db.refreshFeed(feed)));
		res.send("OK");
	},

	refreshFeed: async (req, res) => {
		const { db } = req.app.locals;
		const feedId = req.params.id as FeedId;
		const feed = await db.getFeed(feedId);
		await db.refreshFeed(feed);
		res.send("OK");
	},

	getFeedArticles: async (req, res) => {
		const { db } = req.app.locals;
		const feedId = req.params.id as FeedId;
		const articles = await db.getFeedArticles(feedId);
		res.json(articles);
	},

	getFeedLog: async (req, res) => {
		const { db } = req.app.locals;
		const feedId = req.params.id as FeedId;
		const log = await db.getFeedLog(feedId);
		res.json(log);
	},

	getFeedStat: async (req, res) => {
		const { db } = req.app.locals;
		const feedId = req.params.id as FeedId;
		const { account } = req.locals;
		const log = await db.getFeedStat(account!.id, feedId);
		res.json(log);
	},

	getFeedStats: async (req, res) => {
		const { db } = req.app.locals;
		const { account } = req.locals;
		const feedStats = await db.getFeedStats(account!.id);
		res.json(feedStats);
	},

	getFeed: async (req, res) => {
		const { db } = req.app.locals;
		const feedId = req.params.id as FeedId;
		const log = await db.getFeed(feedId);
		res.json(log);
	},

	deleteFeed: async (req, res) => {
		const { db } = req.app.locals;
		const feedId = req.params.id as FeedId;
		const log = await db.deleteFeed(feedId);
		res.json(log);
	},

	updateFeed: async (req, res) => {
		const { db } = req.app.locals;
		const feedId = req.params.id as FeedId;
		const data = UpdateFeedRequest.parse(await req.json());
		const feed = await db.updateFeed(feedId, data);
		res.json(feed);
	},

	getFeeds: async (req, res) => {
		const { db } = req.app.locals;
		const feeds = await db.getFeeds();
		res.json(feeds);
	},

	addFeed: async (req, res) => {
		const { db } = req.app.locals;
		const data = AddFeedRequest.parse(await req.json());
		const feed = await db.addFeed(data);
		res.json(feed);
	},

	getFeedGroups: async (req, res) => {
		const { db } = req.app.locals;
		const { account } = req.locals;
		const feedGroups = await db.getFeedGroups(account!.id);
		res.json(feedGroups);
	},

	addFeedGroup: async (req, res) => {
		const { db } = req.app.locals;
		const { account } = req.locals;
		const data = AddFeedGroupRequest.parse(await req.json());
		const feedGroup = await db.addFeedGroup(account!.id, data);
		res.json(feedGroup);
	},

	removeFeedFromAllGroups: async (req, res) => {
		const { db } = req.app.locals;
		const feedId = req.params.id as FeedId;
		const { account } = req.locals;
		await db.removeFeedFromAllGroups(account!.id, feedId);
		res.send("OK");
	},

	getFeedGroup: async (req, res) => {
		const { db } = req.app.locals;
		const feedGroupId = req.params.id as FeedGroupId;
		const { account } = req.locals;
		const feedGroup = await db.getFeedGroup(account!.id, feedGroupId);
		res.json(feedGroup);
	},

	addGroupFeed: async (req, res) => {
		const { db } = req.app.locals;
		const { account } = req.locals;
		const feedGroupId = req.params.id as FeedGroupId;
		const data = AddGroupFeedRequest.parse(await req.json());
		const feedGroup = await db.addGroupFeed(account!.id, feedGroupId, data);
		res.json(feedGroup);
	},

	getFeedGroupArticles: async (req, res) => {
		const { db } = req.app.locals;
		const feedGroupId = req.params.id as FeedGroupId;
		const { account } = req.locals;
		const articles = await db.getFeedGroupArticles(account!.id, feedGroupId);
		res.json(articles);
	},

	deleteGroupFeed: async (req, res) => {
		const { db } = req.app.locals;
		const feedGroupId = req.params.id as FeedGroupId;
		const feedId = req.params.feed_id as FeedId;
		const { account } = req.locals;
		const articles = await db.removeFeedFromGroup(
			account!.id,
			feedGroupId,
			feedId,
		);
		res.json(articles);
	},

	testFeedUrl: async (req, res) => {
		const url = req.query_parameters.url;
		const feed = await downloadFeed(url);
		res.json(feed);
	},
} satisfies Record<string, Handler>;
