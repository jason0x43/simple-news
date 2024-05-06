import { Api } from '$lib/api.server';
import type { CreateFeedGroupRequest } from '$server';

export async function POST({ request, fetch, locals }) {
	const data: CreateFeedGroupRequest = await request.json();
	const api = new Api({ fetch, sessionId: locals.sessionId });
	await api.createFeedGroup(data);

	return new Response('ok');
}
