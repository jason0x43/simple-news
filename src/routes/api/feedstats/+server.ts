import { getFeedStats, type FeedStats } from '$lib/db/feed';
import { getUserFeeds } from '$lib/db/feedgroup';
import { json } from '$lib/kit';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export type GetFeedStatsResponse = FeedStats;

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	if (!user) {
		throw error(401, 'not logged in');
	}

	const feeds = await getUserFeeds(user.id);
	const feedStats = await getFeedStats({ userId: user.id, feeds });

	return json(feedStats);
};
