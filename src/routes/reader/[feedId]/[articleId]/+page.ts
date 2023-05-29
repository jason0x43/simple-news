import type { ArticleWithUserData } from '$lib/db/article';
import { responseJson } from '$lib/kit';
import { redirect } from '@sveltejs/kit';

export async function load({ fetch, params }) {
	const { articleId } = params;
	let article: ArticleWithUserData;

	try {
		article = await responseJson<ArticleWithUserData>(
			fetch(`/api/articles/${articleId}`)
		);
	} catch (err) {
		throw redirect(307, '/');
	}

	return { article };
}
