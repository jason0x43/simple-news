import cuid from 'cuid';
import { getDb } from './lib/db.js';
import type { Article, Feed, User } from './schema';

export type FeedStats = {
  [feedId: Feed['id']]: {
    total: number;
    read: number;
  };
};

type CreateFeedData = Omit<Feed, 'id' | 'type' | 'lastUpdate'> &
  Partial<Pick<Feed, 'type' | 'lastUpdate' | 'id'>>;

export function createFeed(data: CreateFeedData): Feed {
  const db = getDb();
  const feed: Feed = db
    .prepare<CreateFeedData & { id: Feed['id'] }>(
      `INSERT INTO Feed (id, url, title, icon, htmlUrl)
    VALUES (@id, @url, @title, @icon, @htmlUrl)`
    )
    .get({ id: cuid(), ...data });
  return feed;
}

export function createOrGetFeed(data: CreateFeedData): Feed {
  const db = getDb();
  const feed: Feed = db
    .prepare<CreateFeedData & { id?: Feed['id'] }>(
      `INSERT INTO Feed (id, url, title, icon, htmlUrl)
    VALUES (@id, @url, @title, @icon, @htmlUrl)
    ON CONFLICT (url) DO NOTHING`
    )
    .get({ id: cuid(), ...data });
  return feed;
}

export function getFeeds(): Feed[] {
  const db = getDb();
  const feeds: Feed[] = db.prepare('SELECT * FROM Feed').all();
  return feeds;
}

export function getFeed(id: string): Feed {
  const db = getDb();
  const feed: Feed = db
    .prepare<Feed['id']>('SELECT * FROM Feed WHERE id = ?')
    .get(id);
  if (!feed) {
    throw new Error(`No feed with id "${id}"`);
  }
  return feed;
}

export function getFeedByUrl(url: string): Feed {
  const db = getDb();
  const feed: Feed = db
    .prepare<Feed['url']>('SELECT * FROM Feed WHERE url = ?')
    .get(url);
  if (!feed) {
    throw new Error(`No feed with url "${url}"`);
  }
  return feed;
}

export function getFeedStats(data: {
  userId: User['id'];
  feeds: Feed[];
}): FeedStats {
  const stats: FeedStats = {};
  const db = getDb();
  const feedIds = data.feeds.map(({ id }) => id);

  for (const feedId of feedIds) {
    const articleIds: Article['id'][] = db
      .prepare<Article['feedId']>('SELECT id FROM Article WHERE feedId = ?')
      .all(feedId)
      .map(({ id }) => id);

    const numRead: number = db
      .prepare<Article['id'][]>(
        `SELECT COUNT(*) FROM UserArticle WHERE articleId IN (${articleIds
          .map(() => '?')
          .join()}) AND read = true`
      )
      .get(...articleIds)['COUNT(*)'];

    stats[feedId] = {
      total: articleIds.length,
      read: numRead
    };
  }

  return stats;
}

export function updateFeedIcon(data: {
  feedId: Feed['id'];
  icon: string;
}): void {
  const db = getDb();
  db.prepare<[Feed['icon'], Feed['id']]>(
    'UPDATE Feed SET icon = ? WHERE id = ?'
  ).run(data.icon, data.feedId);
}
