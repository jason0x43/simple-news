import { createId } from '@paralleldrive/cuid2';
import { sql } from 'kysely';
import db from './lib/db.js';
import type { Feed, InsertableFeed, User } from './lib/db';

export type { Feed };

export type FeedStats = {
	[feedId: Feed['id']]: {
		total: number;
		read: number;
	};
};

type CreateFeedData = Omit<InsertableFeed, 'id' | 'type' | 'lastUpdate'> &
	Partial<Pick<InsertableFeed, 'id' | 'type' | 'lastUpdate'>>;

export async function createFeed(data: CreateFeedData): Promise<Feed> {
	return db
		.insertInto('Feed')
		.values({
			id: createId(),
			...data
		})
		.returningAll()
		.executeTakeFirstOrThrow();
}

export async function createOrGetFeed(data: CreateFeedData): Promise<Feed> {
	return db
		.insertInto('Feed')
		.values({
			id: createId(),
			icon: '',
			htmlUrl: '',
			...data
		})
		.onConflict((conflict) => conflict.column('url').doNothing())
		.returningAll()
		.executeTakeFirstOrThrow();
}

export async function getFeeds(): Promise<Feed[]> {
	const feeds = await db.selectFrom('Feed').selectAll().execute();
	return feeds;
}

export async function getFeed(id: string): Promise<Feed | undefined> {
	return db
		.selectFrom('Feed')
		.selectAll()
		.where('id', '=', id)
		.executeTakeFirst();
}

export async function getFeedByUrl(url: string): Promise<Feed | undefined> {
	return db
		.selectFrom('Feed')
		.selectAll()
		.where('url', '=', url)
		.executeTakeFirst();
}

export async function getFeedStats(data: {
	userId: User['id'];
	feeds: Feed[];
}): Promise<FeedStats> {
	const stats: FeedStats = {};
	const feedIds = data.feeds.map(({ id }) => id);

	for (const feedId of feedIds) {
		const articleIds = (
			await db
				.selectFrom('Article')
				.select('id')
				.where('feedId', '=', feedId)
				.execute()
		).map(({ id }) => id);

		const numRead = await db
			.selectFrom('UserArticle')
			.select(sql<number>`count(*)`.as('count'))
			.where('articleId', 'in', articleIds)
			.where('read', '=', 1)
			.executeTakeFirst();

		stats[feedId] = {
			total: articleIds.length,
			read: numRead?.count ?? 0
		};
	}

	return stats;
}

export async function updateFeedIcon(data: {
	feedId: Feed['id'];
	icon: string;
}): Promise<void> {
	await db
		.updateTable('Feed')
		.set({ icon: data.icon })
		.where('id', '=', data.feedId)
		.executeTakeFirst();
}
