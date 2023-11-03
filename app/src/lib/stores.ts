import type { Feed, FeedGroupWithFeeds, FeedStats } from "server";
import { writable } from "svelte/store";
import { getFeeds, getFeedGroups, getFeedStats } from "./api";

export const feedId = writable<string | undefined>();
export const feedStats = writable<FeedStats | undefined>();
export const feedGroups = writable<FeedGroupWithFeeds[]>([]);
export const feeds = writable<Feed[]>([]);
export const sidebarVisible = writable<boolean>(true);
export const title = writable<string>('News');

export async function loadData() {
	await Promise.allSettled([
		getFeedGroups().then((g) => feedGroups.set(g)),
		getFeedStats().then((s) => feedStats.set(s)),
		getFeeds().then((f) => feeds.set(f)),
	]);
}
