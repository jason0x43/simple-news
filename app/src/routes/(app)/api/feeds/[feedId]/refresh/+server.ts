import { Api } from "$lib/api.server";

export async function GET({ fetch, locals, params }) {
	const { feedId } = params;
	const api = new Api({ fetch, sessionId: locals.sessionId });
	await api.refreshFeed(feedId);

	return new Response("ok");
}
