import type { ArticleWithUserData } from '$lib/db/article';
import { responseJson } from '$lib/kit';
import { redirect } from '@sveltejs/kit';

export async function load({ fetch, params }) {
	const feedId = params.feedId;
	let articles: ArticleWithUserData[] = [];

	try {
		articles = await responseJson<ArticleWithUserData[]>(
			fetch(`/api/feedgroups/${feedId}/articles`)
		);
	} catch (err) {
		throw redirect(307, '/');
	}

	return {
		articles,
		feedId
	};
}
