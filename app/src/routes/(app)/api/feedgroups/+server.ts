import { Api } from "$lib/api.server";
import { AddFeedGroupRequest } from "simple-news-types";

export async function POST({ request, fetch, locals }) {
	const data = AddFeedGroupRequest.parse(await request.json());
	const api = new Api({ fetch, sessionId: locals.sessionId });
	await api.createFeedGroup(data);

	return new Response("OK");
}
