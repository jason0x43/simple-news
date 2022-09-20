import cuid from 'cuid';
import { getDb } from './lib/db.js';
import type { Feed, FeedGroup, FeedGroupFeed, User } from './schema';

export type FeedGroupWithFeeds = FeedGroup & {
  feeds: Feed[];
};

type CreateFeedGroupData = {
  userId: User['id'];
  name: string;
  feeds: Feed['id'][];
};

export function createFeedGroup(data: CreateFeedGroupData): void {
  const db = getDb();
  const feedGroupId = cuid();
  db.transaction(() => {
    db.prepare<FeedGroup>(
      'INSERT INTO FeedGroup (id, userId, name) VALUES (@id, @userId, @name)'
    ).run({ ...data, id: feedGroupId });
    const addFeed = db.prepare<
      [FeedGroupFeed['feedGroupId'], FeedGroupFeed['feedId']]
    >('INSERT INTO FeedGroupFeed (feedGroupId, feedId) VALUES (?, ?)');
    for (const feedId of data.feeds) {
      addFeed.run(feedGroupId, feedId);
    }
  });
}

export function getFeedGroup(id: FeedGroup['id']): FeedGroup {
  const db = getDb();
  const feedGroup: FeedGroup = db
    .prepare<FeedGroup['id']>('SELECT * from FeedGroup WHERE id = ?')
    .get(id);
  return feedGroup;
}

export function getUserFeedGroup(
  userId: User['id'],
  name: FeedGroup['name']
): FeedGroup | null {
  const db = getDb();
  const feedGroup: FeedGroup = db
    .prepare<[User['id'], FeedGroup['name']]>(
      'SELECT * from FeedGroup WHERE userId = ? AND name = ?'
    )
    .get(userId, name);
  return feedGroup;
}

export function getUserFeedGroups(userId: User['id']): FeedGroup[] {
  const db = getDb();
  const feedGroups: FeedGroup[] = db
    .prepare<User['id']>('SELECT * from FeedGroup WHERE userId = ?')
    .all(userId);
  return feedGroups;
}

export function getFeedGroupWithFeeds(id: FeedGroup['id']): FeedGroupWithFeeds {
  const db = getDb();
  const feedGroup: FeedGroup = db
    .prepare<FeedGroup['id']>('SELECT * from FeedGroup WHERE id = ?')
    .get(id);
  const feeds = getGroupFeeds(feedGroup.id);
  return {
    ...feedGroup,
    feeds
  };
}

export function getUserFeedGroupsWithFeeds(
  userId: User['id']
): FeedGroupWithFeeds[] {
  const db = getDb();
  const feedGroups: FeedGroup[] = db
    .prepare<User['id']>('SELECT * from FeedGroup WHERE userId = ?')
    .all(userId);
  const feedGroupsWithFeeds: FeedGroupWithFeeds[] = [];
  for (const group of feedGroups) {
    const feeds = getGroupFeeds(group.id);
    feedGroupsWithFeeds.push({
      ...group,
      feeds
    });
  }
  return feedGroupsWithFeeds;
}

type FindGroupContainingFeedData = {
  userId: User['id'];
  feedId: Feed['id'];
};

export function findUserFeedGroupContainingFeed(
  data: FindGroupContainingFeedData
): FeedGroup | null {
  const db = getDb();

  const feedGroupId: FeedGroup['id'] | null = db
    .prepare<FindGroupContainingFeedData>(
      'SELECT feedGroupId FROM FeedGroupFeed' +
        ' INNER JOIN FeedGroup' +
        ' ON FeedGroup.userId = @userId' +
        ' WHERE FeedGroup.id = FeedGroupFeed.feedGroupId'
    )
    .get(data);

  if (feedGroupId) {
    const feedGroup: FeedGroup | null = db
      .prepare<FeedGroup['id']>('SELECT * FROM FeedGroup WHERE id = ?')
      .get(feedGroupId);
    return feedGroup;
  }

  return null;
}

type DeleteFeedGroupData = Pick<FeedGroup, 'userId' | 'name'>;

export function deleteFeedGroup(data: DeleteFeedGroupData): void {
  const db = getDb();
  db.prepare<DeleteFeedGroupData>(
    'DELETE FROM FeedGroup WHERE userId = @userId AND name = @name'
  ).run(data);
}

export function getUserFeeds(userId: User['id']): Feed[] {
  const db = getDb();

  const feedIds: Feed['id'][] = db
    .prepare<FeedGroup['id']>(
      `SELECT feedId
      FROM FeedGroupFeed
      INNER JOIN FeedGroup
      ON FeedGroup.id = FeedGroupFeed.feedGroupId
      WHERE FeedGroup.userId = ?`
    )
    .all(userId)
    .map(({ feedId }) => feedId);

  const feeds: Feed[] = db
    .prepare<Feed['id'][]>(
      `SELECT * FROM Feed WHERE id IN (${feedIds.map(() => '?').join()})`
    )
    .all(...feedIds);

  return feeds;
}

export function getGroupFeeds(groupId: FeedGroupFeed['feedGroupId']): Feed[] {
  const db = getDb();

  const feedIds: Feed['id'][] = db
    .prepare<FeedGroup['id']>(
      'SELECT feedId FROM FeedGroupFeed WHERE feedGroupId = ?'
    )
    .all(groupId)
    .map(({ feedId }) => feedId);

  const feeds: Feed[] = db
    .prepare<Feed['id'][]>(
      `SELECT * FROM Feed WHERE id IN (${feedIds.map(() => '?').join()})`
    )
    .all(...feedIds);

  return feeds;
}

/**
 * Add feeds to a feed group.
 *
 * @param groupId ID of the group to add feeds to
 * @param feedIds feed IDs to add to the group
 */
export function addFeedsToGroup(
  groupId: FeedGroupFeed['feedGroupId'],
  feedIds: Feed['id'][]
): void {
  const db = getDb();
  db.transaction(() => {
    const creator = db.prepare(
      'INSERT INTO FeedGroupFeed (feedGroupId, feedId) VALUES (?, ?)'
    );
    for (const feedId of feedIds) {
      creator.run(groupId, feedId);
    }
  });
}

/**
 * Remove feeds from a feed group.
 *
 * @param groupId ID of the group to remove feeds from
 * @param feedIds feed IDs to remove from the group
 */
export function removeFeedsFromGroup(
  groupId: FeedGroupFeed['feedGroupId'],
  feedIds: Feed['id'][]
): void {
  const db = getDb();
  db.transaction(() => {
    const creator = db.prepare(
      'DELETE FROM FeedGroupFeed WHERE feedGroupId = ? AND feedId = ?'
    );
    for (const feedId of feedIds) {
      creator.run(groupId, feedId);
    }
  });
}
