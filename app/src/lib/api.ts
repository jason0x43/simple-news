import type {
	AddFeedRequest,
	AddGroupFeedRequest,
	Article,
	ArticleId,
	ArticleSummary,
	CreateFeedGroupRequest,
	Feed,
	FeedGroupId,
	FeedGroupWithFeeds,
	FeedId,
	FeedStats,
	UpdateFeedRequest,
} from "server";

export async function getFeedGroups(): Promise<FeedGroupWithFeeds[]> {
	return apiGet("feedgroups");
}

export async function getFeedStats(): Promise<FeedStats> {
	return apiGet("feedstats");
}

export async function getFeeds(): Promise<Feed[]> {
	return apiGet("feeds");
}

export async function addFeed(data: AddFeedRequest): Promise<Feed> {
	return apiPost("feeds", data);
}

export async function addFeedGroup(
	data: CreateFeedGroupRequest,
): Promise<FeedGroupWithFeeds> {
	return apiPost("feedgroups", data);
}

export async function updateFeed(
	id: FeedId,
	data: UpdateFeedRequest,
): Promise<Feed> {
	return apiPatch(`feeds/${id}`, data);
}

export type ArticlesSource =
	| { feedId: FeedId }
	| { feedGroupId: FeedGroupId };

export async function getArticles(
	source: ArticlesSource | undefined,
): Promise<ArticleSummary[]> {
	if (source === undefined) {
		return apiGet("articles");
	}

	if (isFeedId(source)) {
		return apiGet(`feeds/${source.feedId}/articles`);
	}

	return apiGet(`feedgroups/${source.feedGroupId}/articles`);
}

export async function getArticle(id: ArticleId): Promise<Article> {
	return apiGet(`articles/${id}`);
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
}): Promise<FeedGroupWithFeeds> {
	const body: AddGroupFeedRequest = { feed_id: feedId };
	return apiPost(`feedgroups/${groupId}`, body);
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
}): Promise<FeedGroupWithFeeds> {
	const body: AddGroupFeedRequest = { feed_id: feedId };
	return apiDelete(`feedgroups/${groupId}/${feedId}`);
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
async function apiGet<T>(path: string): Promise<T> {
	const resp = assertOk(await fetch(`/api/${path}`));
	return resp.json();
}

/**
 * Make a delete request to the api server
 *
 * @param path - the api path to delete
 * @returns the returned JSON
 */
async function apiDelete<T>(path: string): Promise<T> {
	const resp = assertOk(await fetch(`/api/${path}`, { method: 'delete' }));
	return resp.json();
}

/**
 * Make a post request to the api server
 *
 * @param path - the api path to get
 * @param data - the JSON data to post
 * @returns the returned JSON
 */
async function apiPost<T>(path: string, data: unknown): Promise<T> {
	const resp = assertOk(
		await fetch(`/api/${path}`, {
			method: "post",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		}),
	);
	return resp.json();
}

/**
 * Make a patch request to the api server
 *
 * @param path - the api path to get
 * @param data - the JSON data to post
 * @returns the returned JSON
 */
async function apiPatch<T>(path: string, data: unknown): Promise<T> {
	const resp = assertOk(
		await fetch(`/api/${path}`, {
			method: "patch",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		}),
	);
	return resp.json();
}
