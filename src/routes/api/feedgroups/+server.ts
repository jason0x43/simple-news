import type { Feed } from '$lib/db/feed';
import type { FeedGroup, FeedGroupWithFeeds } from '$lib/db/feedgroup';
import {
	addFeedsToGroup,
	findUserFeedGroupContainingFeed,
	getUserFeedGroupsWithFeeds,
	removeFeedsFromGroup
} from '$lib/db/feedgroup';
import { json } from '$lib/kit';
import { getSessionOrThrow as getSessionOrThrow } from '$lib/session';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export type GetFeedGroupsResponse = FeedGroupWithFeeds[];

/**
 * Get all feeds
 */
export const GET: RequestHandler = async ({ cookies }) => {
	const session = await getSessionOrThrow(cookies);
	const { user } = session;
	return json(await getUserFeedGroupsWithFeeds(user.id));
};

export type AddGroupFeedRequest = {
	feedId: Feed['id'];
	groupId: FeedGroup['id'] | 'not subscribed';
};

export type AddGroupFeedResponse = Record<string, never>;

/**
 * Add a feed to a feed group
 *
 * The feed will be removed from any existing feed group
 */
export const PUT: RequestHandler = async ({ request, cookies }) => {
	const session = await getSessionOrThrow(cookies);
	const { user } = session;
	const data: AddGroupFeedRequest = await request.json();

	if (typeof data.feedId !== 'string') {
		throw error(400, 'A feed ID must be provided');
	}

	if (typeof data.groupId !== 'string') {
		throw error(400, 'A feed group ID must be provided');
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
