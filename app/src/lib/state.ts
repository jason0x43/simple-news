import type {
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
} from "server";
import { derived, get, readonly, writable } from "svelte/store";
import * as api from "./api";
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
		api.getFeedGroups().then((g) => feedGroupsStore.set(g)),
		api.getFeedStats().then((s) => feedStatsStore.set(s)),
		api.getFeeds().then((f) => feedsStore.set(f)),
	]);
}

/**
 * Load article summaries for the current feed or feed group.
 */
export async function loadArticles() {
	const feedOrGroupId = get(feedIdStore);
	let source: api.ArticlesSource | undefined = undefined;
	if (feedOrGroupId) {
		const [type, id] = feedOrGroupId.split("-");
		source = type === "feed" ? { feedId: id } : { feedGroupId: id };
	}
	const a = await api.getArticles(source);
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
	const newFeed = await api.createFeed({ url, title });
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
	await api.updateFeed(id, data);
	feedsStore.update((feeds) => {
		let index = feeds.findIndex((f) => f.id === id);
		if (index !== -1) {
			return [
				...feeds.slice(0, index),
				{
					...feeds[index],
					url: data.url ?? feeds[index].url,
					title: data.title ?? feeds[index].title,
				},
				...feeds.slice(index + 1),
			];
		}
		return feeds;
	});
}

/**
 * Add a new feed group.
 */
export async function addFeedGroup(data: CreateFeedGroupRequest) {
	const newGroup = await api.createFeedGroup(data);
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
	await api.addGroupFeed({ feedId, groupId });
	feedGroupsStore.update((groups) => {
		let index = groups.findIndex((g) => g.id === groupId);
		if (index !== -1) {
			groups = [
				...groups.slice(0, index),
				{
					...groups[index],
					feed_ids: [...groups[index].feed_ids, feedId],
				},
				...groups.slice(index + 1),
			];
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
	await api.removeGroupFeed({ feedId, groupId });
	feedGroupsStore.update((groups) => {
		let index = groups.findIndex((g) => g.id === groupId);
		if (index !== -1) {
			groups = [
				...groups.slice(0, index),
				{
					...groups[index],
					feed_ids: groups[index].feed_ids.filter((id) => id !== feedId),
				},
				...groups.slice(index + 1),
			];
		}
		return groups;
	});
}

/**
 * Move a feed to a feed group.
 *
 * The feed will be removed from any existing group.
 */
export async function moveFeedToGroup({
	groupId,
	feedId,
}: {
	groupId: FeedGroupId;
	feedId: FeedId;
}) {
	await api.moveGroupFeed({ feedId, groupId });
	feedGroupsStore.update((groups) => groups.map((group) => {
		if (group.id !== groupId && group.feed_ids.includes(feedId)) {
			return {
				...group,
				feed_ids: group.feed_ids.filter((id) => id !== feedId),
			}
		}

		if (group.id === groupId && !group.feed_ids.includes(feedId)) {
			return {
				...group,
				feed_ids: [...group.feed_ids, feedId]
			}
		}

		return group;
	}));
}

/**
 * Refresh a feed.
 */
export async function refreshFeed(feedId: FeedId) {
	await api.refreshFeed(feedId);
}

/**
 * Mark an article as read or saved
 */
export async function markArticle(id: ArticleId, data: ArticleMarkRequest) {
	await api.markArticle(id, data);

	articlesStore.update((articles) => {
		let index = articles.findIndex((a) => a.id === id);
		if (index !== -1) {
			return [
				...articles.slice(0, index),
				{
					...articles[index],
					read: data.read ?? articles[index].read,
					saved: data.saved ?? articles[index].saved,
				},
				...articles.slice(index + 1),
			];
		}
		return [...articles];
	});

	updatedArticleIdStore.update((ids) => {
		let newIds = new Set(ids);
		newIds.add(id);
		return newIds;
	});
}

/**
 * Mark multiple articles as read or saved
 */
export async function markArticles(data: ArticlesMarkRequest) {
	await api.markArticles(data);

	articlesStore.update((articles) =>
		articles.map((a) =>
			data.article_ids.includes(a.id)
				? {
						...a,
						read: data.mark.read ?? a.read,
						saved: data.mark.saved ?? a.saved,
				  }
				: a,
		),
	);

	updatedArticleIdStore.update((ids) => {
		let newIds = new Set(ids);
		for (const id of data.article_ids) {
			newIds.add(id);
		}
		return newIds;
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
				api.getArticle(articleId).then((article) => {
					articleStore.set(article);
				});

				markArticle(articleId, { read: true }).catch((err) => {
					console.warn("Error marking article as read:", err);
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