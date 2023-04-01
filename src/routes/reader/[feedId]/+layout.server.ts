import { getArticles, type ArticleWithUserData } from '$lib/db/article';
import type { Feed } from '$lib/db/feed';
import { getFeedGroup } from '$lib/db/feedgroup';
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

	let selectedFeedIds: Feed['id'][];
	let articles: ArticleWithUserData[];

	if (feedId === 'saved') {
		articles = await getArticles(userId, { filter: 'saved' });
		selectedFeedIds = [];
	} else {
		const [type, id] = feedId.split('-');
		if (type === 'group') {
			articles = await getArticles(userId, {
				feeds: { group: id }
			});
			const group = await getFeedGroup(id);
			selectedFeedIds = group?.feeds.map(({ id }) => id) ?? [];
		} else {
			articles = await getArticles(userId, {
				feeds: { ids: [id] }
			});
			selectedFeedIds = [id];
		}
	}

	return {
		articles,
		feedId,
		selectedFeedIds
	};
}
