import { getFeedStats, type FeedStats } from '$lib/db/feed';
import { getUserFeeds } from '$lib/db/feedgroup';
import { json } from '$lib/kit';
import { getSessionOrThrow } from '$lib/session';
import type { RequestHandler } from './$types';

export type GetFeedStatsResponse = FeedStats;

export const GET: RequestHandler = async ({ request }) => {
	const session = await getSessionOrThrow(request.headers.get('cookie'));
	const { user } = session;
	const feeds = await getUserFeeds(user.id);
	const feedStats = await getFeedStats({
		userId: user.id,
		feeds,
		// don't consider articles older than 6 weeks
		maxAge: 6 * 7 * 24 * 60 * 60 * 1000
	});

	return json(feedStats);
};
