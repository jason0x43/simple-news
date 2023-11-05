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
	FeedStats,
	UpdateFeedRequest,
} from "server";

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

export type ArticlesSource = { feedId: FeedId } | { feedGroupId: FeedGroupId };

/**
 * Get summaries for all articles in a user's subscribed feeds.
 */
export async function getArticles(
	source: ArticlesSource | undefined,
): Promise<ArticleSummary[]> {
	if (source === undefined) {
		return (await apiGet("articles")).json();
	}

	if (isFeedId(source)) {
		return (await apiGet(`feeds/${source.feedId}/articles`)).json();
	}

	return (await apiGet(`feedgroups/${source.feedGroupId}/articles`)).json();
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
export async function markArticles(
	data: ArticlesMarkRequest,
): Promise<void> {
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
export async function refreshFeed(feedId: FeedId) {
	await apiGet(`feeds/${feedId}/refresh`);
}

/**
 * Type guard to check if a value is a feed ID source
 */
function isFeedId(value: ArticlesSource): value is { feedId: FeedId } {
	return "feedId" in value;
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
	return assertOk(await fetch(`/api/${path}`, { method: "delete" }));
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
			method: "post",
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
			method: "patch",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		}),
	);
}
