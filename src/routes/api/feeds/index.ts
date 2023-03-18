import type { GetFeedsResponse } from '$lib/types';

/**
 * Get all feeds
 */
export async function get(): Promise<GetFeedsResponse> {
	const resp = await fetch('/api/feeds');
	const rdata = (await resp.json()) as GetFeedsResponse;
	return rdata;
}

/**
 * Add a new feed
 */
export async function post(feedUrl: string): Promise<GetFeedsResponse> {
	const resp = await fetch('/api/feeds', {
		method: 'POST',
		body: JSON.stringify({ url: feedUrl })
	});
	const rdata = (await resp.json()) as GetFeedsResponse;
	return rdata;
}
