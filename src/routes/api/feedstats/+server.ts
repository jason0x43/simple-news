import { getFeedStats } from '$lib/db/feed';
import { getUserFeeds } from '$lib/db/feedgroup';
import { json } from '$lib/kit';
import { getUserOrThrow } from '$lib/session';
import type { GetFeedStatsResponse } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const user = getUserOrThrow(locals);
	const feeds = await getUserFeeds(user.id);
	const resp: GetFeedStatsResponse = await getFeedStats({
		userId: user.id,
		feeds,
		// don't consider articles older than 6 weeks
		maxAge: 6 * 7 * 24 * 60 * 60 * 1000
	});

	return json(resp);
};
