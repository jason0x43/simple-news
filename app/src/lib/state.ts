import type {
	Article,
	ArticleId,
	ArticleSummary,
	CreateFeedGroupRequest,
	Feed,
	FeedGroupId,
	FeedGroupWithFeeds,
	FeedId,
	FeedStats,
} from "server";
import { derived, get, readonly, writable } from "svelte/store";
import {
	getArticle,
	getArticles,
	getFeeds,
	getFeedGroups,
	getFeedStats,
	type ArticlesSource,
	addGroupFeed,
	addFeed as apiAddFeed,
	addFeedGroup as apiAddFeedGroup,
	updateFeed as apiUpdateFeed,
	removeGroupFeed,
} from "./api";
import { matches, path } from "./router";

const articleIdStore = writable<ArticleId | undefined>();
const articleStore = writable<Article | undefined>();
const feedIdStore = writable<FeedId | undefined>();
const articlesStore = writable<ArticleSummary[]>([]);
const feedGroupsStore = writable<FeedGroupWithFeeds[]>([]);
const feedStatsStore = writable<FeedStats | undefined>();
const feedsStore = writable<Feed[]>([]);
const displayTypeStore = writable<"mobile" | "desktop">("desktop");
const updatedArticleIdStore = writable<Set<ArticleId>>(new Set());

/**
 * Add an article ID to the list of recently updated article IDs.
 *
 * @param id - the article ID to add
 */
export function addUpdatedArticleId(id: ArticleId) {
	const ids = get(updatedArticleIdStore);
	if (!ids.has(id)) {
		const newIds = new Set(ids);
		newIds.add(id);
		updatedArticleIdStore.set(newIds);
	}
}

/**
 * Clear the list of recently updated article IDs.
 */
export function clearUpdatedArticleIds() {
	updatedArticleIdStore.set(new Set());
}

/**
 * Load inital app data.
 */
export async function loadData() {
	await Promise.allSettled([
		getFeedGroups().then((g) => feedGroupsStore.set(g)),
		getFeedStats().then((s) => feedStatsStore.set(s)),
		getFeeds().then((f) => feedsStore.set(f)),
	]);
}

/**
 * Load article summaries for the current feed or feed group.
 */
export async function loadArticles() {
	const feedOrGroupId = get(feedIdStore);
	let source: ArticlesSource | undefined = undefined;
	if (feedOrGroupId) {
		const [type, id] = feedOrGroupId.split("-");
		source = type === "feed" ? { feedId: id } : { feedGroupId: id };
	}
	const a = await getArticles(source);
	articlesStore.set(a);
}

/**
 * Clear the list of article summaries.
 */
export async function clearArticles() {
	articlesStore.set([]);
}

/**
 * Add a new feed.
 *
 * @param url - the feed URL
 * @param title - the feed title
 */
export async function addFeed(url: string, title?: string) {
	const newFeed = await apiAddFeed({ url, title });
	feedsStore.update((feeds) => [...feeds, newFeed]);
}

/**
 * Update a feed's properties.
 *
 * @param id - the ID of the feed to update
 * @param data - the new feed data
 */
export async function updateFeed(
	id: FeedId,
	data: {
		url?: string;
		title?: string;
	},
) {
	const updatedFeed = await apiUpdateFeed(id, data);
	feedsStore.update((feeds) => {
		let index = feeds.findIndex((f) => f.id === id);
		if (index !== -1) {
			return [...feeds.slice(0, index), updatedFeed, ...feeds.slice(index + 1)];
		}
		return [...feeds, updatedFeed];
	});
}

/**
 * Add a new feed group.
 */
export async function addFeedGroup(data: CreateFeedGroupRequest) {
	const newGroup = await apiAddFeedGroup(data);
	feedGroupsStore.update((groups) => [...groups, { ...newGroup, feeds: [] }]);
}

/**
 * Add a feed to a feed group.
 *
 * The feed will be removed from any existing group.
 */
export async function addFeedToGroup({
	groupId,
	feedId,
}: {
	groupId: FeedGroupId;
	feedId: FeedId;
}) {
	const groups = get(feedGroupsStore);
	const oldGroupId = groups.find((g) => g.feed_ids.includes(feedId))?.id;
	if (oldGroupId === groupId) {
		return;
	}

	const addedGroup = await addGroupFeed({ feedId, groupId });
	const removedGroup = oldGroupId
		? await removeGroupFeed({ feedId, groupId: oldGroupId })
		: undefined;

	feedGroupsStore.update((groups) => {
		let addedIndex = groups.findIndex((g) => g.id === groupId);
		if (addedIndex !== -1) {
			groups = [
				...groups.slice(0, addedIndex),
				addedGroup,
				...groups.slice(addedIndex + 1),
			];
		} else {
			groups = [...groups, addedGroup];
		}

		if (removedGroup) {
			let removedIndex = groups.findIndex((g) => g.id === groupId);
			if (removedIndex !== -1) {
				groups = [
					...groups.slice(0, removedIndex),
					...groups.slice(removedIndex + 1),
				];
			}
		}

		return groups;
	});
}

/**
 * Remove a feed from a feed group.
 */
export async function removeFeedFromGroup({
	groupId,
	feedId,
}: {
	groupId: FeedGroupId;
	feedId: FeedId;
}) {
	const updatedGroup = await removeGroupFeed({ feedId, groupId });
	feedGroupsStore.update((groups) => {
		let index = groups.findIndex((g) => g.id === groupId);
		if (index !== -1) {
			return [
				...groups.slice(0, index),
				updatedGroup,
				...groups.slice(index + 1),
			];
		}
		return [...groups, updatedGroup];
	});
}

/**
 * Initialize the state updaters.
 */
export function init() {
	// Update displayType when the window size hits a breakpoint
	const matcher = window.matchMedia("(max-width: 800px)");
	const listener = (event: MediaQueryListEvent) => {
		displayTypeStore.set(event.matches ? "mobile" : "desktop");
	};
	matcher.addEventListener("change", listener);
	displayTypeStore.set(matcher.matches ? "mobile" : "desktop");

	// Update the feedId and articleId when the path changes
	path.subscribe((p) => {
		let params = matches(p, "/reader/:feedGroupId/:articleId");
		if (params) {
			feedIdStore.set(params["feedGroupId"]);
			articleIdStore.set(params["articleId"]);
		} else {
			articleIdStore.set(undefined);
			params = matches(p, "/reader/:feedGroupId");
			if (params) {
				feedIdStore.set(params["feedGroupId"]);
			} else {
				feedIdStore.set(undefined);
			}
		}
	});

	// Load article summaries when the feedId changes
	let prevFeedId: FeedId | undefined;
	feedIdStore.subscribe((feedId) => {
		if (feedId !== prevFeedId) {
			prevFeedId = feedId;
			loadArticles();
			sidebarVisible.set(false);
		} else if (!feedId) {
			clearArticles();
			sidebarVisible.set(true);
		}

		prevFeedId = feedId;
	});

	// Load the target article when the article ID changes
	let prevArticleId: ArticleId | undefined;
	articleIdStore.subscribe((articleId) => {
		if (articleId) {
			if (articleId !== prevArticleId) {
				getArticle(articleId).then((article) => {
					articleStore.set(article);
				});
			}
		} else {
			articleStore.set(undefined);
		}
	});

	// Load initial data
	loadData().catch((err) => {
		console.error("Error loading data:", err);
	});
}

export type ArticleFilter = "unread" | "all";

export const article = readonly(articleStore);
export const articleFeed = derived(
	[feedsStore, articleStore],
	([$feeds, $article]) => {
		if ($article && $feeds) {
			const a = $article;
			return $feeds.find((f) => f.id === a.feed_id);
		}
	},
);
export const articleFilter = writable<ArticleFilter>("unread");
export const articleId = readonly(articleIdStore);
export const articles = readonly(articlesStore);
export const displayType = readonly(displayTypeStore);
export const feed = derived([feedIdStore, feedsStore], ([$feedId, $feeds]) => {
	if ($feedId && $feeds) {
		return $feeds.find((feed) => feed.id === $feedId);
	}
});
export const feedGroups = readonly(feedGroupsStore);
export const feedId = readonly(feedIdStore);
export const feeds = readonly(feedsStore);
export const feedStats = readonly(feedStatsStore);
export const managingFeeds = writable<boolean>(false);
export const selectedFeedIds = derived(
	[feedIdStore, feedGroupsStore],
	([$feedId, $feedGroups]) => {
		if ($feedId && $feedId !== "saved") {
			const [type, id] = $feedId.split("-");
			if (type === "group") {
				const group = $feedGroups.find((g) => g.id === id);
				return group?.feed_ids ?? [];
			}
			return [id];
		}
		return [];
	},
);
export const selectedGroupId = derived([feedIdStore], ([$feedId]) => {
	if ($feedId && $feedId !== "saved") {
		const [type, id] = $feedId.split("-");
		if (type === "group") {
			return id;
		}
	}
});
export const sidebarVisible = writable<boolean>(true);
export const title = derived(
	[feedIdStore, feedGroupsStore, feedsStore],
	([$feedId, $feedGroups, $feeds]) => {
		if ($feedId === "saved") {
			return "Saved";
		}

		if ($feedId) {
			const [type, id] = $feedId.split("-");
			if (type === "group") {
				const group = $feedGroups.find((group) => group.id === id);
				if (group?.name) {
					return group.name;
				}
			}

			const feed = $feeds.find((feed) => feed.id === id);
			if (feed?.title) {
				return feed.title;
			}
		}

		return "News";
	},
);
export const updatedArticleIds = readonly(updatedArticleIdStore);
