import { getFeedStats } from '$lib/db/feed';
import { getUserFeedGroupsWithFeeds, getUserFeeds } from '$lib/db/feedgroup';
import { getSessionOrThrow } from '$lib/session';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ depends, request }) => {
	depends('reader:feedstats');

	const session = await getSessionOrThrow(request.headers.get('cookie'));
	const { user, data: sessionData } = session;

	const feedGroups = await getUserFeedGroupsWithFeeds(user.id);
	const feeds = await getUserFeeds(user.id);
	const feedStats = await getFeedStats({
		userId: user.id,
		feeds,
		// don't consider articles older than 6 weeks
		maxAge: 6 * 7 * 24 * 60 * 60 * 1000
	});

	return {
		user,
		articleFilter: sessionData?.articleFilter,
		feedStats,
		feeds,
		feedGroups
	};
};
