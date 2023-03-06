import {
	addFeedsToGroup,
	findUserFeedGroupContainingFeed,
	getUserFeedGroupsWithFeeds,
	removeFeedsFromGroup
} from '$lib/db/feedgroup';
import { json } from '$lib/kit';
import { getUserOrThrow } from '$lib/session';
import type { GetFeedGroupsResponse } from '$lib/types';
import { error } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';

/**
 * Get all feeds
 */
export const GET: RequestHandler = async ({ locals }) => {
	const user = getUserOrThrow(locals);
	const resp: GetFeedGroupsResponse = await getUserFeedGroupsWithFeeds(user.id);
	return json(resp);
};

const AddGroupFeedRequestSchema = z.object({
	feedId: z.string(),
	groupId: z.string()
});
export type AddGroupFeedRequest = z.infer<typeof AddGroupFeedRequestSchema>;

export type AddGroupFeedResponse = Record<string, never>;

/**
 * Add a feed to a feed group
 *
 * The feed will be removed from any existing feed group
 */
export const PUT: RequestHandler = async ({ locals, request }) => {
	const user = getUserOrThrow(locals);

	let data: AddGroupFeedRequest;

	try {
		data = AddGroupFeedRequestSchema.parse(await request.json());
	} catch (err) {
		throw error(400, 'A feed ID and feed group ID must be provided');
	}

	const existingGroup = await findUserFeedGroupContainingFeed({
		userId: user.id,
		feedId: data.feedId
	});

	if (existingGroup) {
		await removeFeedsFromGroup(existingGroup.id, [data.feedId]);
	}

	if (data.groupId !== 'not subscribed') {
		await addFeedsToGroup(data.groupId, [data.feedId]);
	}

	return new Response();
};
