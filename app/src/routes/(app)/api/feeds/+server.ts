import { Api } from '$lib/api.server';
import type { AddFeedRequest } from '$server';

export async function POST({ request, fetch, locals }) {
	const data: AddFeedRequest = await request.json();
	const api = new Api({ fetch, sessionId: locals.sessionId });
	await api.createFeed(data);

	return new Response('ok');
}
