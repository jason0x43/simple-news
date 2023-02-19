import { getFeedStats } from '$lib/db/feed';
import { getUserFeedGroupsWithFeeds, getUserFeeds } from '$lib/db/feedgroup';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, depends }) => {
	depends('reader:feedstats');

	const { user, sessionData } = locals;
	if (!user) {
		console.log('no active user -- redirecting to login');
		throw redirect(302, '/');
	}

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
		articleFilter: sessionData.articleFilter,
		feedStats,
		feeds,
		feedGroups
	};
};
