import { getFeedStats, type FeedStats } from '$lib/db/feed';
import {
	addFeedToGroup,
	getUserFeedGroups,
	removeFeedFromUser,
	type FeedGroupWithFeeds
} from '$lib/db/feedgroup';
import { json } from '$lib/kit';
import { getUserOrThrow } from '$lib/session';
import type { GetFeedGroupsResponse } from '$lib/types';
import { error } from '@sveltejs/kit';
import { z } from 'zod';

/**
 * Get all feed groups
 */
export async function GET({ locals }) {
	const user = getUserOrThrow(locals);
	const resp: GetFeedGroupsResponse = await getUserFeedGroups(user.id);
	return json(resp);
}

const AddGroupFeedRequestSchema = z.object({
	feedId: z.string(),
	groupId: z.string()
});
export type AddGroupFeedRequest = z.infer<typeof AddGroupFeedRequestSchema>;

export type AddGroupFeedResponse = {
	feedStats: FeedStats;
	feedGroups: FeedGroupWithFeeds[];
};

/**
 * Add a feed to a feed group
 *
 * The feed will be removed from any existing feed group
 */
export async function PUT({ locals, request }) {
	const user = getUserOrThrow(locals);

	let data: AddGroupFeedRequest;

	try {
		data = AddGroupFeedRequestSchema.parse(await request.json());
	} catch (err) {
		throw error(400, 'A feed ID and feed group ID must be provided');
	}

	if (data.groupId === 'not subscribed') {
		await removeFeedFromUser({ userId: user.id, feedId: data.feedId });
	} else {
		await addFeedToGroup(data);
	}

	const rdata = {
		feedGroups: await getUserFeedGroups(user.id),
		feedStats: await getFeedStats(user.id)
	};

	return json<AddGroupFeedResponse>(rdata);
}
