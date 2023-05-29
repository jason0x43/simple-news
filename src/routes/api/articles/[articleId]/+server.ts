import { getArticle, type ArticleWithUserData } from '$lib/db/article';
import { json } from '$lib/kit';
import { text } from '@sveltejs/kit';

/**
 * Get an article
 */
export async function GET({ params, locals }) {
	const { session } = locals;
	if (!session) {
		return text('Not authorized', { status: 401 });
	}
	const article = await getArticle({
		id: params.articleId,
		userId: session.user.id
	});
	return json<ArticleWithUserData>(article);
}
