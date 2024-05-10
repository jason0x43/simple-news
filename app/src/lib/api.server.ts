import { env } from "$env/dynamic/private";
import type {
	AddFeedRequest,
	AddGroupFeedRequest,
	Article,
	ArticleId,
	ArticleMarkRequest,
	ArticleSummary,
	ArticlesMarkRequest,
	CreateFeedGroupRequest,
	Feed,
	FeedGroupId,
	FeedGroupWithFeeds,
	FeedId,
	FeedStat,
	FeedStats,
	SessionResponse,
	UpdateFeedRequest,
	User,
} from "$server";

export class Api {
	#sessionId: string | undefined;
	#fetch: typeof fetch;

	constructor(options: { sessionId?: string; fetch?: typeof fetch }) {
		this.#sessionId = options.sessionId;
		this.#fetch = options.fetch ?? fetch;
	}

	/**
	 * Return a user's information
	 */
	async getUser(): Promise<User> {
		return (await this.#apiGet("me")).json();
	}

	/**
	 * Login to the site
	 *
	 * Return the session ID
	 */
	async login(data: {
		username: string;
		password: string;
	}): Promise<SessionResponse> {
		const resp = await this.#apiPost("login", data);
		const session: SessionResponse = await resp.json();
		this.#sessionId = session.id;
		return session;
	}

	/**
	 * Logout of the site
	 */
	async logout(): Promise<void> {
		this.#assertOk(await this.#apiGet("logout"));
		this.#sessionId = undefined;
	}

	/**
	 * Return all of a user's feed groups.
	 */
	async getFeedGroups(): Promise<FeedGroupWithFeeds[]> {
		return (await this.#apiGet("feedgroups")).json();
	}

	/**
	 * Return the stats for a user's subscribed feeds.
	 */
	async getFeedStats(): Promise<FeedStats> {
		return (await this.#apiGet("feedstats")).json();
	}

	/**
	 * Return all feeds.
	 */
	async getFeeds(): Promise<Feed[]> {
		return (await this.#apiGet("feeds")).json();
	}

	/**
	 * Create a new feed
	 */
	async createFeed(data: AddFeedRequest): Promise<Feed> {
		return (await this.#apiPost("feeds", data)).json();
	}

	/**
	 * Add a group to a feed.
	 */
	async createFeedGroup(
		data: CreateFeedGroupRequest,
	): Promise<FeedGroupWithFeeds> {
		return (await this.#apiPost("feedgroups", data)).json();
	}

	/**
	 * Update a feed's properties
	 */
	async updateFeed(id: FeedId, data: UpdateFeedRequest): Promise<void> {
		await this.#apiPatch(`feeds/${id}`, data);
	}

	/**
	 * Get summaries for all articles in a user's subscribed feeds.
	 */
	async getArticles(): Promise<ArticleSummary[]> {
		return (await this.#apiGet(`articles`)).json();
	}

	/**
	 * Get summaries for all articles in a given feed
	 */
	async getFeedArticles(feedId: string): Promise<ArticleSummary[]> {
		return (await this.#apiGet(`feeds/${feedId}/articles`)).json();
	}

	/**
	 * Get summaries for all articles in a given feed group
	 */
	async getFeedGroupArticles(feedGroupId: string): Promise<ArticleSummary[]> {
		return (await this.#apiGet(`feedgroups/${feedGroupId}/articles`)).json();
	}

	/**
	 * Get summaries for all of a user's saved articles
	 */
	async getSavedArticles(): Promise<ArticleSummary[]> {
		return (await this.#apiGet("articles?saved=true")).json();
	}

	/**
	 * Get a complete article.
	 */
	async getArticle(id: ArticleId): Promise<Article> {
		return (await this.#apiGet(`articles/${id}`)).json();
	}

	/**
	 * Mark an article as saved or read
	 */
	async markArticle(id: ArticleId, data: ArticleMarkRequest): Promise<void> {
		await this.#apiPatch(`articles/${id}`, data);
	}

	/**
	 * Mark multiple articles as saved or read
	 */
	async markArticles(data: ArticlesMarkRequest): Promise<void> {
		await this.#apiPatch(`articles`, data);
	}

	/**
	 * Add a feed to a feed group.
	 *
	 * @param feedId - the feed to add
	 * @param groudId - the group to add the feed to
	 * @returns the updated group
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
	 *
	 * @param feedId - the feed to add
	 * @param groudId - the group to add the feed to
	 * @returns the updated group
	 */
	async moveGroupFeed({
		feedId,
		groupId,
	}: {
		feedId: FeedId;
		groupId: FeedGroupId;
	}): Promise<void> {
		const body: AddGroupFeedRequest = { feed_id: feedId, move_feed: true };
		await this.#apiPost(`feedgroups/${groupId}`, body);
	}

	/**
	 * Remove a feed from a feed group.
	 *
	 * @param feedId - the feed to add
	 * @param groudId - the group to add the feed to
	 * @returns the updated group
	 */
	async removeGroupFeed({
		feedId,
		groupId,
	}: {
		feedId: FeedId;
		groupId: FeedGroupId;
	}): Promise<void> {
		await this.#apiDelete(`feedgroups/${groupId}/${feedId}`);
	}

	/**
	 * Remove a feed from all user feed groups.
	 *
	 * @param feedId - the feed to add
	 * @returns the updated group
	 */
	async removeFeedFromAllGroups(feedId: FeedId): Promise<void> {
		await this.#apiDelete(`feedgroups/feed/${feedId}`);
	}

	/**
	 * Refresh a feed.
	 *
	 * @param feedId - the ID of the feed to refresh
	 */
	async refreshFeed(feedId: FeedId): Promise<FeedStat> {
		await this.#apiGet(`feeds/${feedId}/refresh`);
		return (await this.#apiGet(`feeds/${feedId}/stats`)).json();
	}

	/**
	 * Refresh all feeds.
	 */
	async refreshFeeds(): Promise<FeedStats> {
		await this.#apiGet(`feeds/refresh`);
		return (await this.#apiGet(`feedstats`)).json();
	}

	/**
	 * Assert that a response is successful.
	 *
	 * @returns the response
	 */
	#assertOk(resp: Response): Response {
		if (!resp.ok) {
			throw new Error(resp.statusText);
		}
		return resp;
	}

	/**
	 * Make a get request to the api server
	 *
	 * @param path - the api path to get
	 * @returns the returned JSON
	 */
	async #apiGet(path: string): Promise<Response> {
		return this.#assertOk(
			await this.#fetch(`${env.API_HOST}/api/${path}`, {
				headers: {
					Authorization: this.#sessionId ? `Bearer ${this.#sessionId}` : "",
				},
				credentials: "include",
			}),
		);
	}

	/**
	 * Make a delete request to the api server
	 *
	 * @param path - the api path to delete
	 * @returns the returned JSON
	 */
	async #apiDelete(path: string): Promise<Response> {
		return this.#assertOk(
			await this.#fetch(`${env.API_HOST}/api/${path}`, {
				method: "DELETE",
				headers: {
					Authorization: this.#sessionId ? `Bearer ${this.#sessionId}` : "",
				},
				credentials: "include",
			}),
		);
	}

	/**
	 * Make a post request to the api server
	 *
	 * @param path - the api path to get
	 * @param data - the JSON data to post
	 * @returns the returned JSON
	 */
	async #apiPost(path: string, data: unknown): Promise<Response> {
		return this.#assertOk(
			await this.#fetch(`${env.API_HOST}/api/${path}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.#sessionId ? `Bearer ${this.#sessionId}` : "",
				},
				credentials: "include",
				body: JSON.stringify(data),
			}),
		);
	}

	/**
	 * Make a patch request to the api server
	 *
	 * @param path - the api path to get
	 * @param data - the JSON data to post
	 * @returns the returned JSON
	 */
	async #apiPatch(path: string, data: unknown): Promise<Response> {
		return this.#assertOk(
			await this.#fetch(`${env.API_HOST}/api/${path}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: this.#sessionId ? `Bearer ${this.#sessionId}` : "",
				},
				credentials: "include",
				body: JSON.stringify(data),
			}),
		);
	}
}
