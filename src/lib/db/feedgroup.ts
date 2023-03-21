import { createId } from '@paralleldrive/cuid2';
import type { Feed, FeedGroup, FeedGroupFeed, User } from './lib/db';
import db from './lib/db.js';

export type { FeedGroup, FeedGroupFeed };

export type FeedGroupWithFeeds = FeedGroup & {
	feeds: Feed[];
};

type CreateFeedGroupData = {
	userId: User['id'];
	name: string;
	feeds: Feed['id'][];
};

/**
 * Create a user feed group
 */
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
					feed_id: feedId,
					user_id: data.userId
				})
				.executeTakeFirst();
		}
	});

	return feedGroupId;
}

/**
 * Get a specific feed group, including feeds.
 */
export async function getFeedGroup(
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

/**
 * Find a feed group by name
 */
export async function findFeedGroup(
	userId: FeedGroup['user_id'],
	name: string
): Promise<FeedGroupWithFeeds | undefined> {
	const feedGroup = await db
		.selectFrom('feed_group')
		.selectAll()
		.where('user_id', '=', userId)
		.where('name', '=', name)
		.executeTakeFirst();

	if (feedGroup) {
		const feeds = await getGroupFeeds(feedGroup.id);
		return {
			...feedGroup,
			feeds
		};
	}
}

/**
 * Get all user feed groups, including feeds.
 */
export async function getUserFeedGroups(
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

/**
 * Find the user feed group containing a feed.
 */
export async function findUserFeedGroupContainingFeed(data: {
	userId: User['id'];
	feedId: Feed['id'];
}): Promise<FeedGroup | undefined> {
	const feedGroupId = await db
		.selectFrom('feed_group_feed')
		.select('feed_group_id')
		.where('feed_id', '=', data.feedId)
		.where('user_id', '=', data.userId)
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

/**
 * Delete a feed group.
 */
export async function deleteFeedGroup(
	data: DeleteFeedGroupData
): Promise<void> {
	await db
		.deleteFrom('feed_group')
		.where('user_id', '=', data.user_id)
		.where('name', '=', data.name)
		.executeTakeFirst();
}

/**
 * Return all the feeds a user is subscribed to.
 */
export async function getUserFeeds(userId: User['id']): Promise<Feed[]> {
	const feedIds = (
		await db
			.selectFrom('feed_group_feed')
			.select('feed_id')
			.where('user_id', '=', userId)
			.execute()
	).map(({ feed_id }) => feed_id);

	return db.selectFrom('feed').selectAll().where('id', 'in', feedIds).execute();
}

/**
 * Return all the feeds in a group.
 */
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
 * If a feed is already in a group, it will be removed from that group.
 *
 * @param groupId ID of the group to add feeds to
 * @param feedIds feed IDs to add to the group
 */
export async function addFeedToGroup(data: {
	groupId: FeedGroup['id'];
	feedId: Feed['id'];
}): Promise<void> {
	await db.transaction().execute(async (trx) => {
		const groupUserId = await trx
			.selectFrom('feed_group')
			.select('user_id')
			.where('id', '=', data.groupId)
			.executeTakeFirstOrThrow();
		const { user_id } = groupUserId;

		await trx
			.deleteFrom('feed_group_feed')
			.where('feed_id', '=', data.feedId)
			.where('user_id', '=', user_id)
			.executeTakeFirst();

		await trx
			.insertInto('feed_group_feed')
			.values({
				feed_group_id: data.groupId,
				feed_id: data.feedId,
				user_id
			})
			.executeTakeFirst();
	});
}

/**
 * Remove a feed from the user group it belongs to, if any.
 */
export async function removeFeedFromUser(data: {
	userId: User['id'];
	feedId: Feed['id'];
}): Promise<void> {
	await db
		.deleteFrom('feed_group_feed')
		.where('feed_id', '=', data.feedId)
		.where('user_id', '=', data.userId)
		.executeTakeFirst();
}
