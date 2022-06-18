import type { Feed, User } from '@prisma/client';
import { prisma } from '../db';

export type FeedStats = {
  [feedId: Feed['id']]: {
    total: number;
    read: number;
  };
};

export async function getFeed(id: string): Promise<Feed | null> {
  return prisma.feed.findUnique({
    where: { id }
  });
}

export async function getUserFeeds(userId: User['id']): Promise<Feed[]> {
  const feedGroups = await prisma.feedGroup.findMany({
    where: { userId },
    include: {
      feeds: {
        include: {
          feed: true
        }
      }
    }
  });
  const feeds: Feed[] = [];
  for (const group of feedGroups) {
    feeds.push(...group.feeds.map(({ feed }) => feed));
  }
  return feeds;
}

export async function getFeedStats(feeds: Feed[]): Promise<FeedStats> {
  const stats: FeedStats = {};

  for (const id of feeds.map(({ id }) => id)) {
    const articleIds = await prisma.article.findMany({
      select: {
        id: true
      },
      where: {
        feedId: id
      }
    });

    const numRead = await prisma.userArticle.count({
      where: {
        articleId: {
          in: articleIds.map(({ id }) => id)
        },
        read: true
      }
    });

    stats[id] = {
      total: articleIds.length,
      read: numRead
    };
  }

  return stats;
}
