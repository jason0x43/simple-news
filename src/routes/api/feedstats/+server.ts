import { getFeedStats } from '$lib/db/feed';
import { json } from '$lib/kit';
import { getUserOrThrow } from '$lib/session';
import type { GetFeedStatsResponse } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const user = getUserOrThrow(locals);
	const resp = await getFeedStats(user.id);
	return json<GetFeedStatsResponse>(resp);
};
