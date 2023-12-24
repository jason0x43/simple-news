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
	UpdateFeedRequest,
	User,
} from "server";

/**
 * Return a user's information
 */
export async function getUser(): Promise<User> {
	return (await apiGet("me")).json();
}

/**
 * Login to the site
 */
export async function login(data: {
	username: string;
	password: string;
}): Promise<User> {
	const resp = assertOk(
		await fetch("/api/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify(data),
		}),
	);
	return resp.json();
}

/**
 * Logout of the site
 */
export async function logout(): Promise<void> {
	assertOk(
		await fetch("/api/logout", {
			credentials: "include",
		}),
	);
}

/**
 * Return all of a user's feed groups.
 */
export async function getFeedGroups(): Promise<FeedGroupWithFeeds[]> {
	return (await apiGet("feedgroups")).json();
}

/**
 * Return the stats for a user's subscribed feeds.
 */
export async function getFeedStats(): Promise<FeedStats> {
	return (await apiGet("feedstats")).json();
}

/**
 * Return all feeds.
 */
export async function getFeeds(): Promise<Feed[]> {
	return (await apiGet("feeds")).json();
}

/**
 * Create a new feed
 */
export async function createFeed(data: AddFeedRequest): Promise<Feed> {
	return (await apiPost("feeds", data)).json();
}

/**
 * Add a group to a feed.
 */
export async function createFeedGroup(
	data: CreateFeedGroupRequest,
): Promise<FeedGroupWithFeeds> {
	return (await apiPost("feedgroups", data)).json();
}

/**
 * Update a feed's properties
 */
export async function updateFeed(
	id: FeedId,
	data: UpdateFeedRequest,
): Promise<void> {
	await apiPatch(`feeds/${id}`, data);
}

/**
 * Get summaries for all articles in a user's subscribed feeds.
 */
export async function getArticles(): Promise<ArticleSummary[]> {
	return (await apiGet(`articles`)).json();
}

/**
 * Get summaries for all articles in a given feed
 */
export async function getFeedArticles(
	feedId: string,
): Promise<ArticleSummary[]> {
	return (await apiGet(`feeds/${feedId}/articles`)).json();
}

/**
 * Get summaries for all articles in a given feed group
 */
export async function getFeedGroupArticles(
	feedGroupId: string,
): Promise<ArticleSummary[]> {
	return (await apiGet(`feedgroups/${feedGroupId}/articles`)).json();
}

/**
 * Get summaries for all of a user's saved articles
 */
export async function getSavedArticles(): Promise<ArticleSummary[]> {
	return (await apiGet("articles?saved=true")).json();
}

/**
 * Get a complete article.
 */
export async function getArticle(id: ArticleId): Promise<Article> {
	return (await apiGet(`articles/${id}`)).json();
}

/**
 * Mark an article as saved or read
 */
export async function markArticle(
	id: ArticleId,
	data: ArticleMarkRequest,
): Promise<void> {
	await apiPatch(`articles/${id}`, data);
}

/**
 * Mark multiple articles as saved or read
 */
export async function markArticles(data: ArticlesMarkRequest): Promise<void> {
	await apiPatch(`articles`, data);
}

/**
 * Add a feed to a feed group.
 *
 * @param feedId - the feed to add
 * @param groudId - the group to add the feed to
 * @returns the updated group
 */
export async function addGroupFeed({
	feedId,
	groupId,
}: {
	feedId: FeedId;
	groupId: FeedGroupId;
}): Promise<void> {
	const body: AddGroupFeedRequest = { feed_id: feedId };
	await apiPost(`feedgroups/${groupId}`, body);
}

/**
 * Move a feed to a feed group.
 *
 * @param feedId - the feed to add
 * @param groudId - the group to add the feed to
 * @returns the updated group
 */
export async function moveGroupFeed({
	feedId,
	groupId,
}: {
	feedId: FeedId;
	groupId: FeedGroupId;
}): Promise<void> {
	const body: AddGroupFeedRequest = { feed_id: feedId, move_feed: true };
	await apiPost(`feedgroups/${groupId}`, body);
}

/**
 * Remove a feed from a feed group.
 *
 * @param feedId - the feed to add
 * @param groudId - the group to add the feed to
 * @returns the updated group
 */
export async function removeGroupFeed({
	feedId,
	groupId,
}: {
	feedId: FeedId;
	groupId: FeedGroupId;
}): Promise<void> {
	await apiDelete(`feedgroups/${groupId}/${feedId}`);
}

/**
 * Refresh a feed.
 *
 * @param feedId - the ID of the feed to refresh
 */
export async function refreshFeed(feedId: FeedId): Promise<FeedStat> {
	await apiGet(`feeds/${feedId}/refresh`);
	return (await apiGet(`feeds/${feedId}/stats`)).json();
}

/**
 * Refresh all feeds.
 */
export async function refreshFeeds(): Promise<FeedStats> {
	await apiGet(`feeds/refresh`);
	return (await apiGet(`feedstats`)).json();
}

/**
 * Assert that a response is successful.
 *
 * @returns the response
 */
function assertOk(resp: Response): Response {
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
async function apiGet(path: string): Promise<Response> {
	return assertOk(await fetch(`/api/${path}`));
}

/**
 * Make a delete request to the api server
 *
 * @param path - the api path to delete
 * @returns the returned JSON
 */
async function apiDelete(path: string): Promise<Response> {
	return assertOk(await fetch(`/api/${path}`, { method: "DELETE" }));
}

/**
 * Make a post request to the api server
 *
 * @param path - the api path to get
 * @param data - the JSON data to post
 * @returns the returned JSON
 */
async function apiPost(path: string, data: unknown): Promise<Response> {
	return assertOk(
		await fetch(`/api/${path}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
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
async function apiPatch(path: string, data: unknown): Promise<Response> {
	return assertOk(
		await fetch(`/api/${path}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		}),
	);
}
