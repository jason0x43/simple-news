import { invalidate } from "$app/navigation";
import type {
    AddFeedGroupRequest,
	AddFeedRequest,
	AddGroupFeedRequest,
	MarkArticlesRequest,
	UpdateFeedRequest,
} from "simple-news-types";

export async function markArticles(data: MarkArticlesRequest): Promise<void> {
	const resp = await fetch("/api/mark", {
		method: "POST",
		body: JSON.stringify(data),
	});

	if (!resp.ok) {
		throw new Error("Failed to mark articles");
	}

	await invalidate("app:articles");
	await invalidate("app:feedStats");
}

export async function addFeed(data: AddFeedRequest): Promise<void> {
	const resp = await fetch("/api/feeds", {
		method: "POST",
		body: JSON.stringify(data),
	});

	if (!resp.ok) {
		throw new Error("Failed to create group");
	}

	await invalidate("app:feedGroups");
}

export async function updateFeed(
	feedId: string,
	data: UpdateFeedRequest,
): Promise<void> {
	const resp = await fetch(`/api/feeds/${feedId}`, {
		method: "PATCH",
		body: JSON.stringify(data),
	});

	if (!resp.ok) {
		throw new Error("Failed to create group");
	}

	await invalidate("app:feedGroups");
}

export async function addFeedGroup(
	data: AddFeedGroupRequest,
): Promise<void> {
	const resp = await fetch("/api/feedgroups", {
		method: "POST",
		body: JSON.stringify(data),
	});

	if (!resp.ok) {
		throw new Error("Failed to create group");
	}

	await invalidate("app:feedGroups");
}

export async function addGroupFeed(
	groupId: string,
	data: AddGroupFeedRequest,
): Promise<void> {
	const resp = await fetch(`/api/feedgroups/${groupId}`, {
		method: "POST",
		body: JSON.stringify(data),
	});

	if (!resp.ok) {
		throw new Error("Failed to add feed to group");
	}

	await invalidate("app:feedGroups");
}

export async function removeGroupFeed(
	groupId: string,
	feedId: string,
): Promise<void> {
	const resp = await fetch(`/api/feedgroups/${groupId}/${feedId}`, {
		method: "DELETE",
	});

	if (!resp.ok) {
		throw new Error("Failed to remove feed from group");
	}

	await invalidate("app:feedGroups");
}

export async function removeFeedFromAllGroups(feedId: string): Promise<void> {
	const resp = await fetch(`/api/feedgroups/feed/${feedId}`, {
		method: "DELETE",
	});

	if (!resp.ok) {
		throw new Error("Failed to remove feed from group");
	}

	await invalidate("app:feedGroups");
}

export async function refreshFeed(feedId: string): Promise<void> {
	const resp = await fetch(`/api/feeds/${feedId}/refresh`);

	if (!resp.ok) {
		throw new Error("Failed to remove feed from group");
	}

	await invalidate("app:feedStats");
}
