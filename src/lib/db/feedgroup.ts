import { createId } from '@paralleldrive/cuid2';
import * as db from './lib/db.js';
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
	const feedGroupId = createId();
	const addFeed = db.prepare<
		[FeedGroupFeed['feedGroupId'], FeedGroupFeed['feedId']]
	>('INSERT INTO FeedGroupFeed (feedGroupId, feedId) VALUES (?, ?)');

	db.transaction(() => {
		db.prepare<FeedGroup>(
			'INSERT INTO FeedGroup (id, userId, name) VALUES (@id, @userId, @name)'
		).run({ ...data, id: feedGroupId });
		for (const feedId of data.feeds) {
			addFeed.run(feedGroupId, feedId);
		}
	});
}

export function getFeedGroup(id: FeedGroup['id']): FeedGroup | undefined {
	return db
		.prepare<FeedGroup['id']>('SELECT * from FeedGroup WHERE id = ?')
		.get<FeedGroup>(id);
}

export function getUserFeedGroup(
	userId: User['id'],
	name: FeedGroup['name']
): FeedGroup | undefined {
	return db
		.prepare<[User['id'], FeedGroup['name']]>(
			'SELECT * from FeedGroup WHERE userId = ? AND name = ?'
		)
		.get<FeedGroup>(userId, name);
}

export function getUserFeedGroups(userId: User['id']): FeedGroup[] {
	const feedGroups = db
		.prepare<User['id']>('SELECT * from FeedGroup WHERE userId = ?')
		.all<FeedGroup>(userId);
	return feedGroups;
}

export function getFeedGroupWithFeeds(
	id: FeedGroup['id']
): FeedGroupWithFeeds | undefined {
	const feedGroup = db
		.prepare<FeedGroup['id']>('SELECT * from FeedGroup WHERE id = ?')
		.get<FeedGroup>(id);
	if (!feedGroup) {
		return;
	}

	const feeds = getGroupFeeds(feedGroup.id);
	return {
		...feedGroup,
		feeds
	};
}

export function getUserFeedGroupsWithFeeds(
	userId: User['id']
): FeedGroupWithFeeds[] {
	const feedGroups = db
		.prepare<User['id']>('SELECT * from FeedGroup WHERE userId = ?')
		.all<FeedGroup>(userId);
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
): FeedGroup | undefined {
	const feedGroupId = db
		.prepare<FindGroupContainingFeedData>(
			'SELECT feedGroupId FROM FeedGroupFeed' +
				' INNER JOIN FeedGroup' +
				' ON FeedGroup.userId = @userId' +
				' WHERE FeedGroup.id = FeedGroupFeed.feedGroupId'
		)
		.get<{ feedGroupId: string }>(data);

	if (feedGroupId) {
		return db
			.prepare<FeedGroup['id']>('SELECT * FROM FeedGroup WHERE id = ?')
			.get<FeedGroup>(feedGroupId.feedGroupId);
	}
}

type DeleteFeedGroupData = Pick<FeedGroup, 'userId' | 'name'>;

export function deleteFeedGroup(data: DeleteFeedGroupData): void {
	db.prepare<DeleteFeedGroupData>(
		'DELETE FROM FeedGroup WHERE userId = @userId AND name = @name'
	).run(data);
}

export function getUserFeeds(userId: User['id']): Feed[] {
	const feedIds = db
		.prepare<FeedGroup['id']>(
			`SELECT feedId
			FROM FeedGroupFeed
			INNER JOIN FeedGroup
			ON FeedGroup.id = FeedGroupFeed.feedGroupId
			WHERE FeedGroup.userId = ?`
		)
		.all<{ feedId: string }>(userId)
		.map(({ feedId }) => feedId);

	return db
		.prepare<Feed['id'][]>(
			`SELECT * FROM Feed WHERE id IN (${feedIds.map(() => '?').join()})`
		)
		.all<Feed>(...feedIds);
}

export function getGroupFeeds(groupId: FeedGroupFeed['feedGroupId']): Feed[] {
	const feedIds = db
		.prepare<FeedGroup['id']>(
			'SELECT feedId FROM FeedGroupFeed WHERE feedGroupId = ?'
		)
		.all<{ feedId: string }>(groupId)
		.map(({ feedId }) => feedId);

	return db
		.prepare<Feed['id'][]>(
			`SELECT * FROM Feed WHERE id IN (${feedIds.map(() => '?').join()})`
		)
		.all<Feed>(...feedIds);
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
	const creator = db.prepare(
		'INSERT INTO FeedGroupFeed (feedGroupId, feedId) VALUES (?, ?)'
	);
	db.transaction(() => {
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
	const creator = db.prepare(
		'DELETE FROM FeedGroupFeed WHERE feedGroupId = ? AND feedId = ?'
	);
	db.transaction(() => {
		for (const feedId of feedIds) {
			creator.run(groupId, feedId);
		}
	});
}
