import { getArticle } from '$lib/db/article';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, params }) => {
	const user = locals.user;
	if (!user) {
		throw error(403, 'not logged in');
	}

	const article = getArticle({
		id: params.articleId as string,
		userId: user.id
	});

	return { article };
};
