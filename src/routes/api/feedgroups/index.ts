import type { GetFeedGroupsResponse } from '$lib/types';
import type { AddGroupFeedRequest, AddGroupFeedResponse } from './+server';

/**
 * Get all feed groups
 */
export async function get(): Promise<GetFeedGroupsResponse> {
	const resp = await fetch('/api/feedgroups');
	const rdata = (await resp.json()) as GetFeedGroupsResponse;
	return rdata;
}

/**
 * Add a feed to a feed group
 *
 * The feed will be removed from any existing feed group
 */
export async function put(
	data: AddGroupFeedRequest
): Promise<AddGroupFeedResponse> {
	const resp = await fetch('/api/feedgroups', {
		method: 'PUT',
		body: JSON.stringify(data)
	});
	const rdata = (await resp.json()) as AddGroupFeedResponse;
	return rdata;
}
