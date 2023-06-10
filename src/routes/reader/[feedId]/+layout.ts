import type { ArticleHeadingWithUserData } from '$lib/db/article';
import { responseJson } from '$lib/kit';
import { redirect } from '@sveltejs/kit';

export async function load({ fetch, params }) {
	const feedId = params.feedId;
	let articles: ArticleHeadingWithUserData[] = [];

	try {
		articles = await responseJson<ArticleHeadingWithUserData[]>(
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
