import { getFeedStats } from '$lib/db/feed';
import { getSubscribedFeeds, getUserFeedGroups } from '$lib/db/feedgroup';
import type { SessionWithUser } from '$lib/db/session';
import { getSessionOrThrow } from '$lib/session';
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	let session: SessionWithUser;
	try {
		session = getSessionOrThrow(locals);
	} catch (err) {
		throw redirect(307, '/');
	}

	const { user, data: sessionData } = session;
	const feedGroups = await getUserFeedGroups(user.id);
	const feeds = await getSubscribedFeeds(user.id);
	const feedStats = await getFeedStats(user.id, { feeds });

	return {
		user,
		articleFilter: sessionData?.articleFilter,
		feeds,
		feedStats,
		feedGroups
	};
}
