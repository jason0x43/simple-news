import { Api } from "$lib/api.server.js";
import type { ArticleId } from "@jason0x43/reader-types";

export async function load({ params, fetch, locals }) {
	const articleId = params.article_id as ArticleId;
	const api = new Api({ sessionId: locals.sessionId, fetch });
	const article = await api.getArticle(articleId);
	return { articleId, article };
}
