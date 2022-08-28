import {
  addFeedsToGroup,
  findUserFeedGroupContainingFeed,
  getUserFeedGroupsWithFeeds,
  removeFeedsFromGroup,
  type FeedGroupWithFeeds
} from '$lib/db/feedgroup';
import type { Feed, FeedGroup } from '$lib/db/schema';
import {
  errorResponse,
  unauthResponse,
  type ErrorResponse
} from '$lib/request';
import type { RequestHandler } from './__types/feedgroups';

export type GetFeedGroupsResponse = FeedGroupWithFeeds[] | ErrorResponse;

/**
 * Get all feeds
 */
export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.session?.user;
  if (!user) {
    return unauthResponse();
  }

  return {
    body: getUserFeedGroupsWithFeeds(user.id)
  };
};

export type AddGroupFeedRequest = {
  feedId: Feed['id'];
  groupId: FeedGroup['id'] | 'not subscribed';
};

export type AddGroupFeedResponse = Record<string, never> | ErrorResponse;

/**
 * Add a feed to a feed group
 *
 * The feed will be removed from any existing feed group
 */
export const PUT: RequestHandler = async ({ locals, request }) => {
  const user = locals.session?.user;
  if (!user) {
    return unauthResponse();
  }

  const data: AddGroupFeedRequest = await request.json();

  if (typeof data.feedId !== 'string') {
    return errorResponse({
      feedId: 'A feed ID must be provided'
    });
  }

  if (typeof data.groupId !== 'string') {
    return errorResponse({
      groupId: 'A feed group ID must be provided'
    });
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

  return {};
};
