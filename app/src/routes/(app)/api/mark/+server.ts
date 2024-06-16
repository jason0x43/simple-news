import { Api } from "$lib/api.server";
import { MarkArticlesRequest } from "simple-news-types";

export async function POST({ request, fetch, locals }) {
	const data = MarkArticlesRequest.parse(await request.json());
	const api = new Api({ fetch, sessionId: locals.sessionId });
	await api.markArticles(data);

	return new Response("ok");
}
