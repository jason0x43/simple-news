import { Api } from "$lib/api.server";
import { UpdateFeedRequest } from "@jason0x43/simple-news-types";

export async function PATCH({ request, fetch, locals, params }) {
	const { feedId } = params;
	const data = UpdateFeedRequest.parse(await request.json());
	const api = new Api({ fetch, sessionId: locals.sessionId });
	await api.updateFeed(feedId, data);

	return new Response("ok");
}
