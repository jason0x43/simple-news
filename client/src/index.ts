import {
	AddFeedGroupRequest,
	AddFeedRequest,
	AddGroupFeedRequest,
	Article,
	ArticleId,
	ArticleSummary,
	ArticlesResponse,
	DownloadedFeed,
	Feed,
	FeedGroup,
	FeedGroupId,
	FeedGroupsResponse,
	FeedId,
	FeedLog,
	FeedStat,
	FeedStats,
	FeedsResponse,
	MarkArticleRequest,
	MarkArticlesRequest,
	SessionId,
	UpdateFeedRequest,
} from "@jason0x43/reader-types";
import { AccountResponse, SessionResponse } from "@jason0x43/reader-types";
import { hc } from "hono/client";
import { AppRoutes } from "@jason0x43/reader-server";
import { HTTPException } from "hono/http-exception";
import {
	ClientErrorStatusCode,
	ServerErrorStatusCode,
} from "hono/utils/http-status";

export { HTTPException };

export class Client {
	#client: ReturnType<typeof hc<AppRoutes>>;

	constructor(
		apiHost: string,
		options?: { sessionId?: SessionId; fetch?: typeof fetch },
	) {
		const headers: Record<string, string> = {};
		if (options?.sessionId) {
			headers.Authorization = `Bearer ${options.sessionId}`;
		}

		this.#client = hc<AppRoutes>(apiHost, {
			fetch: options?.fetch ?? fetch,
			headers,
		});
	}

	/**
	 * Login to the site
	 *
	 * Return the session ID
	 */
	async login(username: string, password: string): Promise<SessionResponse> {
		const resp = await this.#client.login.$post({
			json: {
				username,
				password,
			},
		});
		await checkResponse(resp);
		const data = await resp.json();
		return {
			...data,
			sessionId: data.sessionId as SessionId,
			expires: new Date(data.expires),
		};
	}

	/**
	 * Logout of the site
	 */
	async logout(): Promise<void> {
		// Post an empty JSON object so the client will set the content type to
		// application/json which will bypass the CSRF check
		const resp = await this.#client.logout.$post({ json: {} });
		await checkResponse(resp);
	}

	/**
	 * Return a user's information
	 */
	async getAccount(): Promise<AccountResponse> {
		const resp = await this.#client.me.$get();
		await checkResponse(resp);
		return await resp.json();
	}

	/**
	 * Return all of a user's feed groups.
	 */
	async getFeedGroups(): Promise<FeedGroupsResponse> {
		const resp = await this.#client.feedgroups.$get();
		await checkResponse(resp);
		return await resp.json();
	}

	/**
	 * Return the stats for a user's subscribed feeds.
	 */
	async getFeedStats(): Promise<FeedStats> {
		const resp = await this.#client.feedstats.$get();
		await checkResponse(resp);
		return await resp.json();
	}

	/**
	 * Return all feeds.
	 */
	async getFeed(id: FeedId): Promise<Feed> {
		const resp = await this.#client.feeds[":id"].$get({
			param: { id },
		});
		await checkResponse(resp);
		return await resp.json();
	}

	/**
	 * Return all feeds.
	 */
	async getFeeds(): Promise<FeedsResponse> {
		const resp = await this.#client.feeds.$get();
		await checkResponse(resp);
		return await resp.json();
	}

	/**
	 * Create a new feed
	 */
	async createFeed(data: AddFeedRequest): Promise<Feed> {
		const resp = await this.#client.feeds.$post({ json: data });
		await checkResponse(resp);
		return await resp.json();
	}

	/**
	 * Add a group to a feed.
	 */
	async createFeedGroup(data: AddFeedGroupRequest): Promise<FeedGroup> {
		const resp = await this.#client.feedgroups.$post({ json: data });
		await checkResponse(resp);
		return await resp.json();
	}

	/**
	 * Update a feed's properties
	 */
	async updateFeed(id: FeedId, data: UpdateFeedRequest): Promise<Feed> {
		const resp = await this.#client.feeds[":id"].$patch({
			param: { id },
			json: data,
		});
		await checkResponse(resp);
		return await resp.json();
	}

	/**
	 * Get summaries for all articles in a user's subscribed feeds.
	 */
	async getArticles(): Promise<ArticlesResponse> {
		const resp = await this.#client.articles.$get();
		await checkResponse(resp);
		return await resp.json();
	}

	/**
	 * Get summaries for all articles in a given feed
	 */
	async getFeedArticles(feedId: FeedId): Promise<ArticleSummary[]> {
		const resp = await this.#client.feeds[":id"].articles.$get({
			param: { id: feedId },
		});
		await checkResponse(resp);
		return await resp.json();
	}

	/**
	 * Get summaries for all articles in a given feed group
	 */
	async getFeedGroupArticles(
		feedGroupId: FeedGroupId,
	): Promise<ArticleSummary[]> {
		const resp = await this.#client.feedgroups[":id"].articles.$get({
			param: { id: feedGroupId },
		});
		await checkResponse(resp);
		return await resp.json();
	}

	/**
	 * Get summaries for all of a user's saved articles
	 */
	async getSavedArticles(): Promise<ArticleSummary[]> {
		const resp = await this.#client.articles.$get({ query: { saved: "true" } });
		await checkResponse(resp);
		return await resp.json();
	}

	/**
	 * Get a complete article.
	 */
	async getArticle(id: ArticleId): Promise<Article> {
		const resp = await this.#client.articles[":id"].$get({ param: { id } });
		await checkResponse(resp);
		return await resp.json();
	}

	/**
	 * Mark an article as saved or read
	 */
	async markArticle(id: ArticleId, data: MarkArticleRequest): Promise<void> {
		const resp = await this.#client.articles[":id"].$patch({
			param: { id },
			json: data,
		});
		await checkResponse(resp);
		return await resp.json();
	}

	/**
	 * Mark multiple articles as saved or read
	 */
	async markArticles(data: MarkArticlesRequest): Promise<void> {
		const resp = await this.#client.articles.$patch({ json: data });
		await checkResponse(resp);
		return await resp.json();
	}

	/**
	 * Add a feed to a feed group.
	 */
	async addGroupFeed(
		groupId: FeedGroupId,
		data: AddGroupFeedRequest,
	): Promise<FeedGroup> {
		const resp = await this.#client.feedgroups[":id"].$post({
			param: { id: groupId },
			json: data,
		});
		await checkResponse(resp);
		return await resp.json();
	}

	/**
	 * Move a feed to a feed group.
	 */
	async moveGroupFeed(
		groupId: FeedGroupId,
		feedId: FeedId,
	): Promise<FeedGroup> {
		const resp = await this.#client.feedgroups[":id"].$post({
			param: { id: groupId },
			json: { feed_id: feedId, move_feed: true },
		});
		await checkResponse(resp);
		return await resp.json();
	}

	/**
	 * Remove a feed from a feed group.
	 */
	async removeGroupFeed(groupId: FeedGroupId, feedId: FeedId): Promise<void> {
		const resp = await this.#client.feedgroups[":id"][":feed_id"].$delete({
			param: { id: groupId, feed_id: feedId },
		});
		await checkResponse(resp);
	}

	/**
	 * Remove a feed from all user feed groups.
	 */
	async removeFeedFromAllGroups(feedId: FeedId): Promise<void> {
		const resp = await this.#client.feedgroups.feed[":id"].$delete({
			param: { id: feedId },
		});
		await checkResponse(resp);
	}

	/**
	 * Refresh a feed.
	 *
	 * @param feedId - the ID of the feed to refresh
	 */
	async refreshFeed(feedId: FeedId): Promise<FeedStat> {
		await this.#client.feeds[":id"].refresh.$get({ param: { id: feedId } });
		const resp = await this.#client.feeds[":id"].stats.$get({
			param: { id: feedId },
		});
		await checkResponse(resp);
		return await resp.json();
	}

	/**
	 * Refresh all feeds.
	 */
	async refreshFeeds(): Promise<FeedStats> {
		await this.#client.feeds.refresh.$get();
		const resp = await this.#client.feedstats.$get();
		await checkResponse(resp);
		return await resp.json();
	}

	/**
	 * Test a feed URL
	 */
	async testFeedUrl(url: string): Promise<DownloadedFeed> {
		const resp = await this.#client.feed.$get({ query: { url } });
		await checkResponse(resp);
		return await resp.json();
	}

	/**
	 * Get feed logs
	 */
	async getFeedLogs(feedId?: FeedId): Promise<FeedLog[]> {
		if (feedId) {
			const resp = await this.#client.feeds[":id"].log.$get({
				param: { id: feedId },
			});
			await checkResponse(resp);
			return await resp.json();
		}

		const resp = await this.#client.feeds.log.$get();
		await checkResponse(resp);
		return await resp.json();
	}
}

async function checkResponse(resp: Response) {
	if (isErrorStatus(resp.status)) {
		const text = await resp.text();
		throw new HTTPException(resp.status, { message: text });
	}
}

function isErrorStatus(
	status: number,
): status is ClientErrorStatusCode | ServerErrorStatusCode {
	return status >= 400;
}
