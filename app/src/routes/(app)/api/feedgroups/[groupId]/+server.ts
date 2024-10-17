import { Api } from "$lib/api.server";
import type { AddGroupFeedRequest, FeedGroupId } from "@jason0x43/reader-types";

export async function POST({ request, fetch, locals, params }) {
	const data: AddGroupFeedRequest = await request.json();
	const groupId = params.groupId as FeedGroupId;
	const { feed_id: feedId, move_feed: moveFeed } = data;
	const api = new Api({ fetch, sessionId: locals.sessionId });
	await api.addGroupFeed({ groupId, feedId, moveFeed });

	return new Response("ok");
}
