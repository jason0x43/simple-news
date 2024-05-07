import { Api } from "$lib/api.server";

export async function DELETE({ fetch, locals, params }) {
	const api = new Api({ fetch, sessionId: locals.sessionId });
	const groupId = params.groupId;
	const feedId = params.feedId;
	await api.removeGroupFeed({ groupId, feedId });
	return new Response("ok");
}
