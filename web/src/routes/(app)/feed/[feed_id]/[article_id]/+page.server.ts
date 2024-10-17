import { Api } from "$lib/api.server.js";

export async function load({ params, fetch, locals }) {
	const articleId = params.article_id;
	const api = new Api({ sessionId: locals.sessionId, fetch });

	const article = await api.getArticle(articleId);

	return { articleId, article };
}
