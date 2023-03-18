import type { GetFeedStatsResponse } from '$lib/types';

export async function get(): Promise<GetFeedStatsResponse> {
	const resp = await fetch('/api/feedstats');
	const rdata = (await resp.json()) as GetFeedStatsResponse;
	return rdata;
}
