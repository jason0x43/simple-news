import { getFeeds, getFeedStats } from '$lib/db/feed';
import { getUserFeedGroupsWithFeeds, getUserFeeds } from '$lib/db/feedgroup';
import type { SessionWithUser } from '$lib/db/session';
import { getSessionOrThrow } from '$lib/session';
import { redirect } from '@sveltejs/kit';

export async function load({ depends, locals }) {
	depends('reader:feedstats');

	let session: SessionWithUser;
	try {
		session = getSessionOrThrow(locals);
	} catch (err) {
		throw redirect(307, '/');
	}

	const { user, data: sessionData } = session;
	const feedGroups = await getUserFeedGroupsWithFeeds(user.id);
	const feeds = await getFeeds();
	const userFeeds = await getUserFeeds(user.id);
	const feedStats = await getFeedStats(user.id, { feeds });

	return {
		user,
		articleFilter: sessionData?.articleFilter,
		feeds,
		userFeeds,
		feedStats,
		feedGroups
	};
}
