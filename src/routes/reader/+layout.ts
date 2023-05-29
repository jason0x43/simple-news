import type { Feed, FeedStats } from '$lib/db/feed';
import type { User } from '$lib/db/user';
import { responseJson } from '$lib/kit';
import type { GetFeedGroupsResponse } from '$lib/types';
import { redirect } from '@sveltejs/kit';

export async function load({ fetch }) {
	let data: [User, GetFeedGroupsResponse, Feed[], FeedStats];

	try {
		data = await Promise.all([
			responseJson<User>(fetch('/api/user')),
			responseJson<GetFeedGroupsResponse>(fetch('/api/feedgroups')),
			responseJson<Feed[]>(fetch('/api/feeds')),
			responseJson<FeedStats>(fetch('/api/feedstats'))
		]);
	} catch (err) {
		throw redirect(307, '/');
	}

	return {
		user: data[0],
		feedGroups: data[1],
		feeds: data[2],
		feedStats: data[3]
	};
}
