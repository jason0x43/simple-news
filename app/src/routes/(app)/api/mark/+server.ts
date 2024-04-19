import type { MarkArticlesRequest } from '$lib/api.js';
import { Api } from '$lib/api.server';

export async function POST({ request, fetch, locals }) {
	const data: MarkArticlesRequest = await request.json();

	const api = new Api({ fetch, sessionId: locals.sessionId });
	await api.markArticles(data);

	return new Response('ok');
}
