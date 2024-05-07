import { Api } from "$lib/api.server";
import type { ArticlesMarkRequest } from "$server";

export async function POST({ request, fetch, locals }) {
	const data: ArticlesMarkRequest = await request.json();

	const api = new Api({ fetch, sessionId: locals.sessionId });
	await api.markArticles(data);

	return new Response("ok");
}
