import { getFeedStats } from '$lib/db/feed';
import { getSubscribedFeeds, getUserFeedGroups } from '$lib/db/feedgroup';
import type { User } from '$lib/db/user';
import { getUserOrThrow } from '$lib/session';
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	let user: User;
	try {
		user = getUserOrThrow(locals);
	} catch (err) {
		throw redirect(307, '/');
	}

	const feedGroups = await getUserFeedGroups(user.id);
	const feeds = await getSubscribedFeeds(user.id);
	const feedStats = await getFeedStats(user.id, { feeds });

	return {
		user,
		feeds,
		feedStats,
		feedGroups
	};
}
