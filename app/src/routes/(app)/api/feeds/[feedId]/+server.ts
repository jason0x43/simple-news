import { Api } from '$lib/api.server';
import type { UpdateFeedRequest } from '$server';

export async function PATCH({ request, fetch, locals, params }) {
	const { feedId } = params;
	const data: UpdateFeedRequest = await request.json();
	const api = new Api({ fetch, sessionId: locals.sessionId });
	await api.updateFeed(feedId, data);

	return new Response('ok');
}
