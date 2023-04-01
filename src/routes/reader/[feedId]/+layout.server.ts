import { getArticles, type ArticleWithUserData } from '$lib/db/article';
import type { User } from '$lib/db/user';
import { getUserOrThrow } from '$lib/session';
import { redirect } from '@sveltejs/kit';

export async function load({ locals, params }) {
	let user: User;

	try {
		user = getUserOrThrow(locals);
	} catch (err) {
		throw redirect(307, '/');
	}

	const userId = user.id;
	const feedId = params.feedId;

	let articles: ArticleWithUserData[] = [];

	if (feedId === 'saved') {
		articles = await getArticles(userId, { filter: 'saved' });
	} else {
		const [type, id] = feedId.split('-');
		if (type === 'group') {
			articles = await getArticles(userId, {
				feeds: { group: id }
			});
		} else {
			articles = await getArticles(userId, {
				feeds: { ids: [id] }
			});
		}
	}

	return {
		articles,
		feedId
	};
}
