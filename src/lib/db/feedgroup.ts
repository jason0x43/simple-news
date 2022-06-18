import type { Feed, FeedGroup, FeedGroupFeed } from '@prisma/client';
import { prisma } from '../db';

export type FeedGroupWithFeeds = FeedGroup & {
  feeds: (FeedGroupFeed & {
    feed: Feed;
  })[];
};

export async function getUserFeedGroupById(
  id: string
): Promise<FeedGroupWithFeeds | null> {
  return prisma.feedGroup.findUnique({
    where: {
      id
    },
    include: {
      feeds: {
        include: {
          feed: true
        }
      }
    }
  });
}

export async function getUserFeedGroupFromName({
  userId,
  groupName
}: {
  userId: string;
  groupName: string;
}): Promise<FeedGroupWithFeeds | null> {
  return prisma.feedGroup.findUnique({
    where: {
      userId_name: {
        userId,
        name: groupName
      }
    },
    include: {
      feeds: {
        include: {
          feed: true
        }
      }
    }
  });
}
