import { getArticleHeadings } from '$lib/db/article';
import type { Feed } from '$lib/db/feed';
import { getFeedGroupWithFeeds } from '$lib/db/feedgroup';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, params, depends }) => {
	// Depend on a virtual route so we have a way to call `invalidate`
	depends('user:articleFilter');

	if (!locals.user) {
		console.log('no active user -- redirecting to login');
		throw redirect(302, '/login');
	}

	const userId = locals.user.id;
	const feedId = params.feedId;
	const [type, id] = feedId.split('-');
	let feedIds: Feed['id'][];

	if (type === 'group') {
		const group = await getFeedGroupWithFeeds(id);
		feedIds = group?.feeds.map(({ id }) => id) ?? [];
	} else {
		feedIds = [id];
	}

	const articleHeadings = await getArticleHeadings({
		feedIds,
		userId,
		filter: locals.sessionData.articleFilter,
		// articles no older than 6 weeks
		maxAge: 6 * 7 * 24 * 60 * 60 * 1000
	});

	return {
		articleHeadings,
		feedId,
		articleId: params.articleId
	};
};
