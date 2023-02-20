import { getFeedStats, type FeedStats } from '$lib/db/feed';
import { getUserFeeds } from '$lib/db/feedgroup';
import { json } from '$lib/kit';
import { getSessionOrThrow } from '$lib/session';
import type { RequestHandler } from './$types';

export type GetFeedStatsResponse = FeedStats;

export const GET: RequestHandler = async ({ cookies }) => {
	const session = await getSessionOrThrow(cookies);
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
