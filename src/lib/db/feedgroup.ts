import { createId } from '@paralleldrive/cuid2';
import db from './lib/db.js';
import type { Feed, FeedGroup, FeedGroupFeed, User } from './lib/db';

export type { FeedGroup, FeedGroupFeed };

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
			.insertInto('feed_group')
			.values({
				user_id: data.userId,
				name: data.name,
				id: feedGroupId
			})
			.executeTakeFirst();
		for (const feedId of data.feeds) {
			await trx
				.insertInto('feed_group_feed')
				.values({
					feed_group_id: feedGroupId,
					feed_id: feedId
				})
				.executeTakeFirst();
		}
	});

	return feedGroupId;
}

export async function getFeedGroup(id: FeedGroup['id']): Promise<FeedGroup> {
	return db
		.selectFrom('feed_group')
		.selectAll()
		.where('id', '=', id)
		.executeTakeFirstOrThrow();
}

export async function getUserFeedGroup(
	userId: User['id'],
	name: FeedGroup['name']
): Promise<FeedGroup | undefined> {
	return db
		.selectFrom('feed_group')
		.selectAll()
		.where('user_id', '=', userId)
		.where('name', '=', name)
		.executeTakeFirst();
}

export async function getUserFeedGroups(
	userId: User['id']
): Promise<FeedGroup[]> {
	return db
		.selectFrom('feed_group')
		.selectAll()
		.where('user_id', '=', userId)
		.execute();
}

export async function getFeedGroupWithFeeds(
	id: FeedGroup['id']
): Promise<FeedGroupWithFeeds> {
	const feedGroup = await db
		.selectFrom('feed_group')
		.selectAll()
		.where('id', '=', id)
		.executeTakeFirstOrThrow();

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
		.selectFrom('feed_group')
		.selectAll()
		.where('user_id', '=', userId)
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
		.selectFrom('feed_group_feed')
		.select('feed_group_id')
		.distinct()
		.innerJoin('feed_group', (join) =>
			join.on('feed_group.user_id', '=', data.userId)
		)
		.where('feed_group.id', '=', 'feed_group_feed.feed_group_id')
		.where('feed_group_feed.feed_id', '=', data.feedId)
		.executeTakeFirst();

	if (feedGroupId) {
		return db
			.selectFrom('feed_group')
			.selectAll()
			.where('id', '=', feedGroupId.feed_group_id)
			.executeTakeFirst();
	}
}

type DeleteFeedGroupData = Pick<FeedGroup, 'user_id' | 'name'>;

export async function deleteFeedGroup(
	data: DeleteFeedGroupData
): Promise<void> {
	await db
		.deleteFrom('feed_group')
		.where('user_id', '=', data.user_id)
		.where('name', '=', data.name)
		.executeTakeFirst();
}

export async function getUserFeeds(userId: User['id']): Promise<Feed[]> {
	const feedIds = (
		await db
			.selectFrom('feed_group_feed')
			.select('feed_id')
			.innerJoin('feed_group', 'feed_group.id', 'feed_group_feed.feed_group_id')
			.where('feed_group.user_id', '=', userId)
			.execute()
	).map(({ feed_id }) => feed_id);

	return db.selectFrom('feed').selectAll().where('id', 'in', feedIds).execute();
}

export async function getGroupFeeds(
	groupId: FeedGroupFeed['feed_group_id']
): Promise<Feed[]> {
	const feedIds = (
		await db
			.selectFrom('feed_group_feed')
			.select('feed_id')
			.where('feed_group_id', '=', groupId)
			.execute()
	).map(({ feed_id }) => feed_id);

	return db.selectFrom('feed').selectAll().where('id', 'in', feedIds).execute();
}

/**
 * Add feeds to a feed group.
 *
 * @param groupId ID of the group to add feeds to
 * @param feedIds feed IDs to add to the group
 */
export async function addFeedsToGroup(
	groupId: FeedGroupFeed['feed_group_id'],
	feedIds: Feed['id'][]
): Promise<void> {
	await db.transaction().execute(async (trx) => {
		for (const feedId of feedIds) {
			await trx
				.insertInto('feed_group_feed')
				.values({
					feed_group_id: groupId,
					feed_id: feedId
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
	groupId: FeedGroupFeed['feed_group_id'],
	feedIds: Feed['id'][]
): Promise<void> {
	for (const feedId of feedIds) {
		await db
			.deleteFrom('feed_group_feed')
			.where('feed_group_id', '=', groupId)
			.where('feed_id', '=', feedId)
			.executeTakeFirst();
	}
}
