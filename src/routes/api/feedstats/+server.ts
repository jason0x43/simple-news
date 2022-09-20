import { getFeedStats, type FeedStats } from '$lib/db/feed';
import { getUserFeeds } from '$lib/db/feedgroup';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export type GetFeedStatsResponse = FeedStats;

export const GET: RequestHandler = ({ locals }) => {
	const user = locals.user;
	if (!user) {
		throw error(401, 'not logged in');
	}

	const feeds = getUserFeeds(user.id);
	const feedStats = getFeedStats({ userId: user.id, feeds });

	return json(feedStats);
};
