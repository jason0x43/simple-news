import { createId } from '@paralleldrive/cuid2';
import db from './lib/db.js';
import type { Feed, FeedGroup, FeedGroupFeed, User } from './lib/db';

export type { FeedGroup };

export type FeedGroupWithFeeds = FeedGroup & {
	feeds: Feed[];
};

type CreateFeedGroupData = {
	userId: User['id'];
	name: string;
	feeds: Feed['id'][];
};

export async function createFeedGroup(
	data: CreateFeedGroupData
): Promise<FeedGroup['id']> {
	const feedGroupId = createId();

	await db.transaction().execute(async (trx) => {
		await trx
			.insertInto('FeedGroup')
			.values({
				userId: data.userId,
				name: data.name,
				id: feedGroupId
			})
			.executeTakeFirst();
		for (const feedId of data.feeds) {
			await trx
				.insertInto('FeedGroupFeed')
				.values({
					feedGroupId,
					feedId
				})
				.executeTakeFirst();
		}
	});

	return feedGroupId;
}

export async function getFeedGroup(
	id: FeedGroup['id']
): Promise<FeedGroup | undefined> {
	return db
		.selectFrom('FeedGroup')
		.selectAll()
		.where('id', '=', id)
		.executeTakeFirst();
}

export async function getUserFeedGroup(
	userId: User['id'],
	name: FeedGroup['name']
): Promise<FeedGroup | undefined> {
	return db
		.selectFrom('FeedGroup')
		.selectAll()
		.where('userId', '=', userId)
		.where('name', '=', name)
		.executeTakeFirst();
}

export async function getUserFeedGroups(
	userId: User['id']
): Promise<FeedGroup[]> {
	return db
		.selectFrom('FeedGroup')
		.selectAll()
		.where('userId', '=', userId)
		.execute();
}

export async function getFeedGroupWithFeeds(
	id: FeedGroup['id']
): Promise<FeedGroupWithFeeds | undefined> {
	const feedGroup = await db
		.selectFrom('FeedGroup')
		.selectAll()
		.where('id', '=', id)
		.executeTakeFirst();
	if (!feedGroup) {
		return;
	}

	const feeds = await getGroupFeeds(feedGroup.id);
	return {
		...feedGroup,
		feeds
	};
}

export async function getUserFeedGroupsWithFeeds(
	userId: User['id']
): Promise<FeedGroupWithFeeds[]> {
	const feedGroups = await db
		.selectFrom('FeedGroup')
		.selectAll()
		.where('userId', '=', userId)
		.execute();
	const feedGroupsWithFeeds: FeedGroupWithFeeds[] = [];
	for (const group of feedGroups) {
		const feeds = await getGroupFeeds(group.id);
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

export async function findUserFeedGroupContainingFeed(
	data: FindGroupContainingFeedData
): Promise<FeedGroup | undefined> {
	const feedGroupId = await db
		.selectFrom('FeedGroupFeed')
		.select('feedGroupId')
		.distinct()
		.innerJoin('FeedGroup', (join) =>
			join.on('FeedGroup.userId', '=', data.userId)
		)
		.where('FeedGroup.id', '=', 'FeedGroupFeed.feedGroupId')
		.where('FeedGroupFeed.feedId', '=', data.feedId)
		.executeTakeFirst();

	if (feedGroupId) {
		return db
			.selectFrom('FeedGroup')
			.selectAll()
			.where('id', '=', feedGroupId.feedGroupId)
			.executeTakeFirst();
	}
}

type DeleteFeedGroupData = Pick<FeedGroup, 'userId' | 'name'>;

export async function deleteFeedGroup(
	data: DeleteFeedGroupData
): Promise<void> {
	await db
		.deleteFrom('FeedGroup')
		.where('userId', '=', data.userId)
		.where('name', '=', data.name)
		.executeTakeFirst();
}

export async function getUserFeeds(userId: User['id']): Promise<Feed[]> {
	const feedIds = (
		await db
			.selectFrom('FeedGroupFeed')
			.select('feedId')
			.innerJoin('FeedGroup', 'FeedGroup.id', 'FeedGroupFeed.feedGroupId')
			.where('FeedGroup.userId', '=', userId)
			.execute()
	).map(({ feedId }) => feedId);

	return db.selectFrom('Feed').selectAll().where('id', 'in', feedIds).execute();
}

export async function getGroupFeeds(
	groupId: FeedGroupFeed['feedGroupId']
): Promise<Feed[]> {
	const feedIds = (
		await db
			.selectFrom('FeedGroupFeed')
			.select('feedId')
			.where('feedGroupId', '=', groupId)
			.execute()
	).map(({ feedId }) => feedId);

	return db.selectFrom('Feed').selectAll().where('id', 'in', feedIds).execute();
}

/**
 * Add feeds to a feed group.
 *
 * @param groupId ID of the group to add feeds to
 * @param feedIds feed IDs to add to the group
 */
export async function addFeedsToGroup(
	groupId: FeedGroupFeed['feedGroupId'],
	feedIds: Feed['id'][]
): Promise<void> {
	await db.transaction().execute(async (trx) => {
		for (const feedId of feedIds) {
			await trx
				.insertInto('FeedGroupFeed')
				.values({
					feedGroupId: groupId,
					feedId
				})
				.executeTakeFirst();
		}
	});
}

/**
 * Remove feeds from a feed group.
 *
 * @param groupId ID of the group to remove feeds from
 * @param feedIds feed IDs to remove from the group
 */
export async function removeFeedsFromGroup(
	groupId: FeedGroupFeed['feedGroupId'],
	feedIds: Feed['id'][]
): Promise<void> {
	for (const feedId of feedIds) {
		await db
			.deleteFrom('FeedGroupFeed')
			.where('feedGroupId', '=', groupId)
			.where('feedId', '=', feedId)
			.executeTakeFirst();
	}
}
