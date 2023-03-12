import { getFeedStats } from '$lib/db/feed';
import { json } from '$lib/kit';
import { getUserOrThrow } from '$lib/session';
import type { GetFeedStatsResponse } from '$lib/types';

export async function GET({ locals }) {
	const user = getUserOrThrow(locals);
	const resp = await getFeedStats(user.id);
	return json<GetFeedStatsResponse>(resp);
}
