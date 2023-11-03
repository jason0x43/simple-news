import type {
	Article,
	ArticleSummary,
	Feed,
	FeedGroupWithFeeds,
	FeedStats,
} from "server";
import { writable } from "svelte/store";
import { getArticles, getFeeds, getFeedGroups, getFeedStats } from "./api";

export const articleId = writable<Article["id"] | undefined>();
export const articles = writable<ArticleSummary[]>([]);
export const feedGroups = writable<FeedGroupWithFeeds[]>([]);
export const feedId = writable<Feed["id"] | undefined>();
export const feedStats = writable<FeedStats | undefined>();
export const feeds = writable<Feed[]>([]);
export const sidebarVisible = writable<boolean>(true);
export const title = writable<string>("News");
export const updatedArticleIds = writable<Set<Article["id"]>>(new Set());

export async function loadData() {
	await Promise.allSettled([
		getFeedGroups().then((g) => feedGroups.set(g)),
		getFeedStats().then((s) => feedStats.set(s)),
		getFeeds().then((f) => feeds.set(f)),
	]);
}

export async function loadArticles() {
	getArticles().then((g) => articles.set(g));
}
