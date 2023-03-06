import { getFeeds, getFeedStats } from '$lib/db/feed';
import { getUserFeedGroupsWithFeeds, getUserFeeds } from '$lib/db/feedgroup';
import { getSessionOrRedirect } from '$lib/session';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ depends, locals }) => {
	depends('reader:feedstats');

	const session = getSessionOrRedirect(locals);
	const { user, data: sessionData } = session;
	const feedGroups = await getUserFeedGroupsWithFeeds(user.id);
	const feeds = await getFeeds();
	const userFeeds = await getUserFeeds(user.id);
	const feedStats = await getFeedStats({
		userId: user.id,
		feeds,
		// don't consider articles older than 6 weeks
		maxAge: 6 * 7 * 24 * 60 * 60 * 1000
	});

	return {
		user,
		articleFilter: sessionData?.articleFilter,
		feeds,
		userFeeds,
		feedStats,
		feedGroups
	};
};
