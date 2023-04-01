import { createId } from '@paralleldrive/cuid2';
import { sql } from 'kysely';
import db from './lib/db.js';
import type { Feed, InsertableFeed, User } from './lib/db';
import { getSubscribedFeeds } from './feedgroup.js';

export type { Feed };

export type FeedStats = {
	feeds: {
		[feedId: Feed['id']]: {
			total: number;
			read: number;
		};
	};
	saved: number;
};

type CreateFeedData = Omit<InsertableFeed, 'id' | 'type' | 'last_update'> &
	Partial<Pick<InsertableFeed, 'id' | 'type' | 'last_update'>>;

export async function createFeed(data: CreateFeedData): Promise<Feed> {
	return db
		.insertInto('feed')
		.values({
			id: createId(),
			...data
		})
		.returningAll()
		.executeTakeFirstOrThrow();
}

type UpdateFeedData = {
	feed: Pick<InsertableFeed, 'id'> &
		Partial<Pick<InsertableFeed, 'url' | 'title'>>;
};

export async function updateFeed(data: UpdateFeedData): Promise<Feed> {
	const { id, ...values } = data.feed;

	return db
		.updateTable('feed')
		.set(values)
		.where('id', '=', id)
		.returningAll()
		.executeTakeFirstOrThrow();
}

export async function getFeeds(): Promise<Feed[]> {
	const feeds = await db.selectFrom('feed').selectAll().execute();
	return feeds;
}

/**
 * Get all the feeds with active subscriptions
 */
export async function getActiveFeeds(): Promise<Feed[]> {
	const feedGroupFeedIds = await db
		.selectFrom('feed_group_feed')
		.select(['feed_id'])
		.distinct()
		.execute();

	const feedIds = feedGroupFeedIds.map(({ feed_id }) => feed_id);

	return db.selectFrom('feed').selectAll().where('id', 'in', feedIds).execute();
}

export async function getFeed(id: string): Promise<Feed> {
	return db
		.selectFrom('feed')
		.selectAll()
		.where('id', '=', id)
		.executeTakeFirstOrThrow();
}

export async function getFeedByUrl(url: string): Promise<Feed | undefined> {
	return db
		.selectFrom('feed')
		.selectAll()
		.where('url', '=', url)
		.executeTakeFirst();
}

export async function getFeedStats(
	userId: User['id'],
	options?: {
		feeds?: Feed[];
		maxAge?: number;
	}
): Promise<FeedStats> {
	const stats: FeedStats = {
		feeds: {},
		saved: 0
	};
	const feeds = options?.feeds ?? (await getSubscribedFeeds(userId));
	const { maxAge = 6 * 7 * 24 * 60 * 60 * 1000 } = options ?? {};

	await Promise.all(
		feeds.map(async (feed) => {
			let articleQuery = db
				.selectFrom('article')
				.select('id')
				.where('feed_id', '=', feed.id);

			if (maxAge) {
				const cutoff = BigInt(Date.now() - maxAge);
				articleQuery = articleQuery.where('published', '>', cutoff);
			}

			const articleIds = (await articleQuery.execute()).map(({ id }) => id);

			const numRead = await db
				.selectFrom('user_article')
				.select(sql<number>`count(*)`.as('count'))
				.where('user_id', '=', userId)
				.where('article_id', 'in', articleIds)
				.where('read', '=', 1)
				.executeTakeFirst();

			stats.feeds[feed.id] = {
				total: articleIds.length,
				read: numRead?.count ?? 0
			};
		})
	);

	const numSaved = await db
		.selectFrom('user_article')
		.select(sql<number>`count(*)`.as('count'))
		.where('user_id', '=', userId)
		.where('saved', '=', 1)
		.executeTakeFirst();

	stats.saved = numSaved?.count ?? 0;

	return stats;
}

export async function updateFeedIcon(data: {
	feedId: Feed['id'];
	icon: string;
}): Promise<void> {
	await db
		.updateTable('feed')
		.set({ icon: data.icon })
		.where('id', '=', data.feedId)
		.executeTakeFirst();
}
