import cuid from 'cuid';
import * as db from './lib/db.js';
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
	const feed = db
		.prepare<CreateFeedData & { id: Feed['id'] }>(
			`INSERT INTO Feed (id, url, title, icon, htmlUrl)
			VALUES (@id, @url, @title, @icon, @htmlUrl)
			RETURNING *`
		)
		.get<Feed>({ id: cuid(), ...data });
	if (!feed) {
		throw new Error(`Unable to create feed`);
	}
	return feed;
}

export function createOrGetFeed(data: CreateFeedData): Feed {
	const feed = db
		.prepare<CreateFeedData & { id?: Feed['id'] }>(
			`INSERT INTO Feed (id, url, title, icon, htmlUrl)
			VALUES (@id, @url, @title, @icon, @htmlUrl)
			ON CONFLICT (url) DO NOTHING
			RETURNING *`
		)
		.get<Feed>({ id: cuid(), ...data });
	if (!feed) {
		throw new Error('Unable to get or create feed');
	}
	return feed;
}

export function getFeeds(): Feed[] {
	const feeds: Feed[] = db.prepare('SELECT * FROM Feed').all();
	return feeds;
}

export function getFeed(id: string): Feed | undefined {
	return db
		.prepare<Feed['id']>('SELECT * FROM Feed WHERE id = ?')
		.get<Feed>(id);
}

export function getFeedByUrl(url: string): Feed | undefined {
	return db
		.prepare<Feed['url']>('SELECT * FROM Feed WHERE url = ?')
		.get<Feed>(url);
}

export function getFeedStats(data: {
	userId: User['id'];
	feeds: Feed[];
}): FeedStats {
	const stats: FeedStats = {};
	const feedIds = data.feeds.map(({ id }) => id);

	for (const feedId of feedIds) {
		const articleIds: Article['id'][] = db
			.prepare<Article['feedId']>('SELECT id FROM Article WHERE feedId = ?')
			.all<Pick<Article, 'id'>>(feedId)
			.map(({ id }) => id);

		const numRead = db
			.prepare<Article['id'][]>(
				`SELECT COUNT(*) FROM UserArticle WHERE articleId IN (${articleIds
					.map(() => '?')
					.join()}) AND read = true`
			)
			.get<{ 'COUNT(*)': number }>(...articleIds)?.['COUNT(*)'];

		stats[feedId] = {
			total: articleIds.length,
			read: numRead ?? 0
		};
	}

	return stats;
}

export function updateFeedIcon(data: {
	feedId: Feed['id'];
	icon: string;
}): void {
	db.prepare<[Feed['icon'], Feed['id']]>(
		'UPDATE Feed SET icon = ? WHERE id = ?'
	).run(data.icon, data.feedId);
}
