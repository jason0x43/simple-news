import { invalidate } from "$app/navigation";
import { Client } from "@jason0x43/reader-client";
import type {
	AddFeedGroupRequest,
	AddFeedRequest,
	AddGroupFeedRequest,
	FeedGroupId,
	FeedId,
	MarkArticlesRequest,
	UpdateFeedRequest,
} from "@jason0x43/reader-types";

export async function markArticles(data: MarkArticlesRequest): Promise<void> {
	const client = new Client("/api/");
	await client.markArticles(data);
	await invalidate("app:articles");
	await invalidate("app:feedStats");
}

export async function addFeed(data: AddFeedRequest): Promise<void> {
	const client = new Client("/api/");
	await client.createFeed(data);
	await invalidate("app:feedGroups");
}

export async function updateFeed(
	feedId: FeedId,
	data: UpdateFeedRequest,
): Promise<void> {
	const client = new Client("/api/");
	await client.updateFeed(feedId, data);
}

export async function addFeedGroup(data: AddFeedGroupRequest): Promise<void> {
	const client = new Client("/api/");
	await client.createFeedGroup(data);
	await invalidate("app:feedGroups");
}

export async function addGroupFeed(
	groupId: FeedGroupId,
	data: AddGroupFeedRequest,
): Promise<void> {
	const client = new Client("/api/");
	await client.addGroupFeed(groupId, data);
	await invalidate("app:feedGroups");
}

export async function removeGroupFeed(
	groupId: FeedGroupId,
	feedId: FeedId,
): Promise<void> {
	const client = new Client("/api/");
	await client.removeGroupFeed(groupId, feedId);
	await invalidate("app:feedGroups");
}

export async function removeFeedFromAllGroups(feedId: FeedId): Promise<void> {
	const client = new Client("/api/");
	await client.removeFeedFromAllGroups(feedId);
	await invalidate("app:feedGroups");
}

export async function refreshFeed(feedId: FeedId): Promise<void> {
	const client = new Client("/api/");
	await client.refreshFeed(feedId);
	await invalidate("app:feedStats");
}
