import {
	addFeedsToGroup,
	findUserFeedGroupContainingFeed,
	getUserFeedGroupsWithFeeds,
	removeFeedsFromGroup,
	type FeedGroupWithFeeds
} from '$lib/db/feedgroup';
import type { Feed, FeedGroup } from '$lib/db/schema';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export type GetFeedGroupsResponse = FeedGroupWithFeeds[];

/**
 * Get all feeds
 */
export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	if (!user) {
		return error(401, 'not logged in');
	}

	return json(getUserFeedGroupsWithFeeds(user.id));
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
export const PUT: RequestHandler = async ({ locals, request }) => {
	const user = locals.user;
	if (!user) {
		throw error(401, 'not logged in');
	}

	const data: AddGroupFeedRequest = await request.json();

	if (typeof data.feedId !== 'string') {
		throw error(400, 'A feed ID must be provided');
	}

	if (typeof data.groupId !== 'string') {
		throw error(400, 'A feed group ID must be provided');
	}

	const existingGroup = findUserFeedGroupContainingFeed({
		userId: user.id,
		feedId: data.feedId
	});

	if (existingGroup) {
		removeFeedsFromGroup(existingGroup.id, [data.feedId]);
	}

	if (data.groupId !== 'not subscribed') {
		addFeedsToGroup(data.groupId, [data.feedId]);
	}

	return new Response();
};
