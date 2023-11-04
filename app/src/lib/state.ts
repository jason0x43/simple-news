import type {
	Article,
	ArticleSummary,
	Feed,
	FeedGroupWithFeeds,
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
} from "./api";
import { matches, path } from "./router";

const articleIdStore = writable<Article["id"] | undefined>();
const articleStore = writable<Article | undefined>();
const feedIdStore = writable<Feed["id"] | undefined>();
const articlesStore = writable<ArticleSummary[]>([]);
const feedGroupsStore = writable<FeedGroupWithFeeds[]>([]);
const feedStatsStore = writable<FeedStats | undefined>();
const feedsStore = writable<Feed[]>([]);
const displayTypeStore = writable<"mobile" | "desktop">("desktop");
const updatedArticleIdStore = writable<Set<Article["id"]>>(new Set());

export function addUpdatedArticleId(id: Article["id"]) {
	const ids = get(updatedArticleIdStore);
	if (!ids.has(id)) {
		const newIds = new Set(ids);
		newIds.add(id);
		updatedArticleIdStore.set(newIds);
	}
}

export function clearUpdatedArticleIds() {
	updatedArticleIdStore.set(new Set());
}

export async function loadData() {
	await Promise.allSettled([
		getFeedGroups().then((g) => feedGroupsStore.set(g)),
		getFeedStats().then((s) => feedStatsStore.set(s)),
		getFeeds().then((f) => feedsStore.set(f)),
	]);
}

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

export async function clearArticles() {
	articlesStore.set([]);
}

// Initialize the state updaters
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
		let match = matches(p, "/reader/:feedGroupId/:articleId");
		if (match) {
			feedIdStore.set(match.params["feedGroupId"]);
			articleIdStore.set(match.params["articleId"]);
		} else {
			articleIdStore.set(undefined);
			match = matches(p, "/reader/:feedGroupId");
			if (match) {
				feedIdStore.set(match.params["feedGroupId"]);
			} else {
				feedIdStore.set(undefined);
			}
		}
	});

	// Load article summaries when the feedId changes
	let prevFeedId: Feed["id"] | undefined;
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
	let prevArticleId: Article["id"] | undefined;
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

export const article = readonly(articleStore);
export const articles = readonly(articlesStore);
export const articleFeed = derived(
	[feedsStore, articleStore],
	([$feeds, $article]) => {
		if ($article && $feeds) {
			const a = $article;
			return $feeds.find((f) => f.id === a.feed_id);
		}
	},
);
export const articleId = readonly(articleIdStore);
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
export const selectedFeedIds = derived(
	[feedIdStore, feedGroupsStore],
	([$feedId, $feedGroups]) => {
		if ($feedId && $feedId !== "saved") {
			const [type, id] = $feedId.split("-");
			if (type === "group") {
				const group = $feedGroups.find((g) => g.id === id);
				return group?.feeds.map(({ id }) => id) ?? [];
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
