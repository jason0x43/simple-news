import {
	AddFeedGroupRequest,
	AddFeedRequest,
	AddGroupFeedRequest,
	Article,
	ArticleSummary,
	ArticlesResponse,
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
	PasswordLoginRequest,
	UpdateFeedRequest,
} from "simple-news-types";
import { AccountResponse, SessionResponse } from "simple-news-types";
import { ResponseError } from "./error.js";

export class Client {
	#apiHost: string;
	#sessionId: string | undefined;
	#fetch: typeof fetch;

	constructor(
		apiHost: string,
		options?: { sessionId?: string; fetch?: typeof fetch },
	) {
		this.#apiHost = apiHost;
		this.#sessionId = options?.sessionId;
		this.#fetch = options?.fetch ?? fetch;
		console.log(`Initialized client for host ${apiHost}`);
	}

	/**
	 * Login to the site
	 *
	 * Return the session ID
	 */
	async login(username: string, password: string): Promise<string> {
		const body: PasswordLoginRequest = {
			username,
			password,
		};
		const resp = await this.#apiPost("login", body);
		const session = SessionResponse.parse(await resp.json());
		return session.sessionId;
	}

	/**
	 * Logout of the site
	 */
	async logout(): Promise<void> {
		await this.#apiPost("logout", {});
		this.#sessionId = undefined;
	}

	/**
	 * Return a user's information
	 */
	async getAccount(): Promise<AccountResponse> {
		const resp = await this.#apiGet("me");
		return AccountResponse.parse(await resp.json());
	}

	/**
	 * Return all of a user's feed groups.
	 */
	async getFeedGroups(): Promise<FeedGroupsResponse> {
		const resp = await this.#apiGet("feedgroups");
		return FeedGroupsResponse.parse(await resp.json());
	}

	/**
	 * Return the stats for a user's subscribed feeds.
	 */
	async getFeedStats(): Promise<FeedStats> {
		const resp = await this.#apiGet("feedstats");
		return FeedStats.parse(await resp.json());
	}

	/**
	 * Return all feeds.
	 */
	async getFeed(id: FeedId): Promise<Feed> {
		const resp = await this.#apiGet(`feeds/${id}`);
		return Feed.parse(await resp.json());
	}

	/**
	 * Return all feeds.
	 */
	async getFeeds(): Promise<FeedsResponse> {
		const resp = await this.#apiGet("feeds");
		return FeedsResponse.parse(await resp.json());
	}

	/**
	 * Create a new feed
	 */
	async createFeed(data: AddFeedRequest): Promise<Feed> {
		const resp = await this.#apiPost("feeds", data);
		return Feed.parse(await resp.json());
	}

	/**
	 * Add a group to a feed.
	 */
	async createFeedGroup(data: AddFeedGroupRequest): Promise<FeedGroup> {
		const resp = await this.#apiPost("feedgroups", data);
		return FeedGroup.parse(await resp.json());
	}

	/**
	 * Update a feed's properties
	 */
	async updateFeed(id: string, data: UpdateFeedRequest): Promise<void> {
		await this.#apiPatch(`feeds/${id}`, data);
	}

	/**
	 * Get summaries for all articles in a user's subscribed feeds.
	 */
	async getArticles(): Promise<ArticlesResponse> {
		const resp = await this.#apiGet(`articles`);
		return ArticlesResponse.parse(await resp.json());
	}

	/**
	 * Get summaries for all articles in a given feed
	 */
	async getFeedArticles(feedId: string): Promise<ArticleSummary[]> {
		const resp = await this.#apiGet(`feeds/${feedId}/articles`);
		return ArticlesResponse.parse(await resp.json());
	}

	/**
	 * Get summaries for all articles in a given feed group
	 */
	async getFeedGroupArticles(feedGroupId: string): Promise<ArticleSummary[]> {
		const resp = await this.#apiGet(`feedgroups/${feedGroupId}/articles`);
		return ArticlesResponse.parse(await resp.json());
	}

	/**
	 * Get summaries for all of a user's saved articles
	 */
	async getSavedArticles(): Promise<ArticleSummary[]> {
		const resp = await this.#apiGet("articles?saved=true");
		return ArticlesResponse.parse(await resp.json());
	}

	/**
	 * Get a complete article.
	 */
	async getArticle(id: string): Promise<Article> {
		const resp = await this.#apiGet(`articles/${id}`);
		return Article.parse(await resp.json());
	}

	/**
	 * Mark an article as saved or read
	 */
	async markArticle(id: string, data: MarkArticleRequest): Promise<void> {
		await this.#apiPatch(`articles/${id}`, data);
	}

	/**
	 * Mark multiple articles as saved or read
	 */
	async markArticles(data: MarkArticlesRequest): Promise<void> {
		await this.#apiPatch(`articles`, data);
	}

	/**
	 * Add a feed to a feed group.
	 */
	async addGroupFeed({
		feedId,
		groupId,
		moveFeed,
	}: {
		feedId: FeedId;
		groupId: FeedGroupId;
		moveFeed: boolean;
	}): Promise<void> {
		const body: AddGroupFeedRequest = {
			feed_id: feedId,
			move_feed: moveFeed ?? false,
		};
		await this.#apiPost(`feedgroups/${groupId}`, body);
	}

	/**
	 * Move a feed to a feed group.
	 */
	async moveGroupFeed({
		feedId,
		groupId,
	}: {
		feedId: FeedId;
		groupId: string;
	}): Promise<void> {
		const body: AddGroupFeedRequest = { feed_id: feedId, move_feed: true };
		await this.#apiPost(`feedgroups/${groupId}`, body);
	}

	/**
	 * Remove a feed from a feed group.
	 */
	async removeGroupFeed({
		feedId,
		groupId,
	}: {
		feedId: string;
		groupId: string;
	}): Promise<void> {
		await this.#apiDelete(`feedgroups/${groupId}/${feedId}`);
	}

	/**
	 * Remove a feed from all user feed groups.
	 */
	async removeFeedFromAllGroups(feedId: string): Promise<void> {
		await this.#apiDelete(`feedgroups/feed/${feedId}`);
	}

	/**
	 * Refresh a feed.
	 *
	 * @param feedId - the ID of the feed to refresh
	 */
	async refreshFeed(feedId: string): Promise<FeedStat> {
		await this.#apiGet(`feeds/${feedId}/refresh`);
		const resp = await this.#apiGet(`feeds/${feedId}/stats`);
		return FeedStat.parse(await resp.json());
	}

	/**
	 * Refresh all feeds.
	 */
	async refreshFeeds(): Promise<FeedStats> {
		await this.#apiGet(`feeds/refresh`);
		const resp = await this.#apiGet(`feedstats`);
		return FeedStats.parse(await resp.json());
	}

	/**
	 * Test a feed URL
	 */
	async testFeedUrl(url: string): Promise<object> {
		const params = new URLSearchParams({ url });
		const resp = await this.#apiGet(`feed?${params}`);
		return await resp.json();
	}

	/**
	 * Get feed logs
	 */
	async getFeedLogs(feedId?: FeedId): Promise<FeedLog[]> {
		const resp = await this.#apiGet(`feeds${feedId ? `/${feedId}` : ""}/log`);
		return await resp.json();
	}

	async #apiGet(path: string): Promise<Response> {
		const headers = new Headers();
		if (this.#sessionId) {
			headers.set("Authorization", `Bearer ${this.#sessionId}`);
		}

		const resp = await this.#fetch(`${this.#apiHost}/${path}`, {
			headers,
		});

		if (resp.status >= 400) {
			throw new ResponseError(resp.status, `failed to get ${path}`);
		}

		return resp;
	}

	async #apiDelete(path: string): Promise<Response> {
		const headers = new Headers();
		if (this.#sessionId) {
			headers.set("Authorization", `Bearer ${this.#sessionId}`);
		}

		const resp = await this.#fetch(`${this.#apiHost}/${path}`, {
			method: "DELETE",
			headers,
		});

		if (resp.status >= 400) {
			throw new ResponseError(resp.status, `failed to delete ${path}`);
		}

		return resp;
	}

	async #apiPost(path: string, body: unknown): Promise<Response> {
		const headers = new Headers();
		headers.set("Content-Type", "application/json");
		if (this.#sessionId) {
			headers.set("Authorization", `Bearer ${this.#sessionId}`);
		}

		const resp = await this.#fetch(`${this.#apiHost}/${path}`, {
			method: "POST",
			headers,
			body: JSON.stringify(body),
		});

		if (resp.status >= 400) {
			throw new ResponseError(resp.status, `failed to post to ${path}`);
		}

		return resp;
	}

	async #apiPatch(path: string, body: unknown): Promise<Response> {
		const headers = new Headers();
		headers.set("Content-Type", "application/json");
		if (this.#sessionId) {
			headers.set("Authorization", `Bearer ${this.#sessionId}`);
		}

		const resp = await this.#fetch(`${this.#apiHost}/${path}`, {
			method: "PATCH",
			headers,
			body: JSON.stringify(body),
		});

		if (resp.status >= 400) {
			throw new ResponseError(resp.status, `failed to patch ${path}`);
		}

		return resp;
	}
}
