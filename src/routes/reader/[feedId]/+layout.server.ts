import {
	getArticleHeadings,
	getSavedArticleHeadings,
	type ArticleHeadingWithUserData
} from '$lib/db/article';
import { getFeed, type Feed } from '$lib/db/feed';
import { getFeedGroupWithFeeds } from '$lib/db/feedgroup';
import { getUserOrRedirect } from '$lib/session';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, params }) => {
	const user = getUserOrRedirect(locals);
	const userId = user.id;
	const feedId = params.feedId;

	let feedName: string;
	let selectedFeedIds: Feed['id'][];
	let articleHeadings: ArticleHeadingWithUserData[];

	if (feedId === 'saved') {
		articleHeadings = await getSavedArticleHeadings(userId);
		selectedFeedIds = [];
		feedName = 'Saved';
	} else {
		const [type, id] = feedId.split('-');
		if (type === 'group') {
			const group = await getFeedGroupWithFeeds(id);
			selectedFeedIds = group?.feeds.map(({ id }) => id) ?? [];
			feedName = group.name;
		} else {
			const feed = await getFeed(id);
			selectedFeedIds = [id];
			feedName = feed.title;
		}

		articleHeadings = await getArticleHeadings({
			feedIds: selectedFeedIds,
			userId,
			// articles no older than 6 weeks
			maxAge: 6 * 7 * 24 * 60 * 60 * 1000
		});
	}

	return {
		articleHeadings,
		feedId,
		feedName,
		selectedFeedIds
	};
};
