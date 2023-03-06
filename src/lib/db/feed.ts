import { createId } from '@paralleldrive/cuid2';
import { sql } from 'kysely';
import db from './lib/db.js';
import type { Feed, InsertableFeed, User } from './lib/db';

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

export async function createOrGetFeed(data: CreateFeedData): Promise<Feed> {
	return db
		.insertInto('feed')
		.values({
			id: createId(),
			icon: '',
			html_url: '',
			...data
		})
		.onConflict((conflict) => conflict.column('url').doNothing())
		.returningAll()
		.executeTakeFirstOrThrow();
}

export async function getFeeds(): Promise<Feed[]> {
	const feeds = await db.selectFrom('feed').selectAll().execute();
	return feeds;
}

export async function getEnabledFeeds(): Promise<Feed[]> {
	const feeds = await db
		.selectFrom('feed')
		.selectAll()
		.where('disabled', 'is not', 1)
		.execute();
	return feeds;
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

export async function getFeedStats(data: {
	userId: User['id'];
	feeds: Feed[];
	maxAge?: number;
}): Promise<FeedStats> {
	const stats: FeedStats = {
		feeds: {},
		saved: 0
	};
	const feedIds = data.feeds.map(({ id }) => id);

	for (const feedId of feedIds) {
		let articleQuery = db
			.selectFrom('article')
			.select('id')
			.where('feed_id', '=', feedId);
		if (data.maxAge) {
			const cutoff = BigInt(Date.now() - data.maxAge);
			articleQuery = articleQuery.where('published', '>', cutoff);
		}

		const articleIds = (await articleQuery.execute()).map(({ id }) => id);

		const numRead = await db
			.selectFrom('user_article')
			.select(sql<number>`count(*)`.as('count'))
			.where('article_id', 'in', articleIds)
			.where('read', '=', 1)
			.executeTakeFirst();

		stats.feeds[feedId] = {
			total: articleIds.length,
			read: numRead?.count ?? 0
		};
	}

	const numSaved = await db
		.selectFrom('user_article')
		.select(sql<number>`count(*)`.as('count'))
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
