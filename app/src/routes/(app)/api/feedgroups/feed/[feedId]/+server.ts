import { Api } from "$lib/api.server";

export async function DELETE({ fetch, locals, params }) {
	const { feedId } = params;
	const api = new Api({ fetch, sessionId: locals.sessionId });
	await api.removeFeedFromAllGroups(feedId);

	return new Response("ok");
}
