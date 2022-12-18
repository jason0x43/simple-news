import { getArticleHeadings } from '$lib/db/article';
import { getFeedGroupWithFeeds } from '$lib/db/feedgroup';
import type { Feed } from '$lib/db/schema';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		console.log('no active user -- redirecting to login');
		throw redirect(302, '/login');
	}

	const userId = locals.user.id;
	const feedId = params.feedId;
	const [type, id] = feedId.split('-');
	let feedIds: Feed['id'][];

	if (type === 'group') {
		const group = getFeedGroupWithFeeds(id);
		feedIds = group?.feeds.map(({ id }) => id) ?? [];
	} else {
		feedIds = [id];
	}
	const articleHeadings = getArticleHeadings({
		feedIds,
		userId
	});

	return {
		articleHeadings,
		feedId
	};
};
