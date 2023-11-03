import type { Feed, FeedGroupWithFeeds, FeedStats } from "server";

export async function getFeedGroups(): Promise<FeedGroupWithFeeds[]> {
	const resp = await fetch("/api/feedgroups");
	return resp.json();
}

export async function getFeedStats(): Promise<FeedStats> {
	const resp = await fetch("/api/feedstats");
	return resp.json();
}

export async function getFeeds(): Promise<Feed[]> {
	const resp = await fetch("/api/feeds");
	return resp.json();
}
