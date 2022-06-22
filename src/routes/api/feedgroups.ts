import { prisma } from '$lib/db';
import {
  errorResponse,
  unauthResponse,
  type ErrorResponse
} from '$lib/request';
import type {
  Feed,
  FeedGroup,
  FeedGroupFeed,
  PrismaPromise
} from '@prisma/client';
import type { RequestHandler } from '@sveltejs/kit';

export type FeedGroupWithFeeds = FeedGroup & {
  feeds: FeedGroupFeed[];
};

export type GetFeedGroupsResponse = FeedGroupWithFeeds[] | ErrorResponse;

/**
 * Get all feeds
 */
export const get: RequestHandler<
  Record<string, string>,
  GetFeedGroupsResponse
> = async ({ locals }) => {
  const user = locals.session?.user;
  if (!user) {
    return unauthResponse();
  }

  return {
    body: await prisma.feedGroup.findMany({
      where: {
        userId: user.id
      },
      include: {
        feeds: true
      }
    })
  };
};

export type AddGroupFeedRequest = {
  feedId: Feed['id'];
  groupId: FeedGroup['id'];
};

export type AddGroupFeedResponse = Record<string, never> | ErrorResponse;

/**
 * Add a feed to a feed group
 *
 * The feed will be removed from any existing feed group
 */
export const put: RequestHandler<
  Record<string, string>,
  AddGroupFeedResponse
> = async ({ locals, request }) => {
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

  const existingGroup = await prisma.feedGroup.findFirst({
    where: {
      feeds: {
        some: {
          feedId: data.feedId
        }
      }
    }
  });

  const queries: PrismaPromise<unknown>[] = [];

  if (existingGroup) {
    queries.push(
      prisma.feedGroupFeed.delete({
        where: {
          feedGroupId_feedId: {
            feedId: data.feedId,
            feedGroupId: existingGroup?.id
          }
        }
      })
    );
  }

  queries.push(
    prisma.feedGroupFeed.create({
      data: {
        feedId: data.feedId,
        feedGroupId: data.groupId
      }
    })
  );

  try {
    await prisma.$transaction(queries);
  } catch (error) {
    return errorResponse(`${error}`, 500);
  }

  return {};
};
