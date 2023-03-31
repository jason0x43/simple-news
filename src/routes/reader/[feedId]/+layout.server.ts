import { getArticleContent } from '$lib/article';
import {
	getArticles,
	getSavedArticles,
	type ArticleWithUserData
} from '$lib/db/article';
import { getFeed, type Feed } from '$lib/db/feed';
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
		articles = await getSavedArticles(userId);
		selectedFeedIds = [];
	} else {
		const [type, id] = feedId.split('-');
		if (type === 'group') {
			const group = await getFeedGroup(id);
			selectedFeedIds = group?.feeds.map(({ id }) => id) ?? [];
		} else {
			const feed = await getFeed(id);
			selectedFeedIds = [id];
		}

		articles = await getArticles(userId, {
			feedIds: selectedFeedIds
		});
	}

	return {
		articles: articles.map((article) => ({
			...article,
			content: getArticleContent(article)
		})),
		feedId,
		selectedFeedIds
	};
}
