import { getArticleHeadings } from '$lib/db/article';
import type { Feed } from '$lib/db/feed';
import { getFeedGroupWithFeeds } from '$lib/db/feedgroup';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ parent, params }) => {
	const { user } = await parent();
	const userId = user.id;
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
		// articles no older than 6 weeks
		maxAge: 6 * 7 * 24 * 60 * 60 * 1000
	});

	return {
		articleHeadings,
		feedId
	};
};
