import sqlite3 from 'better-sqlite3';
import { Kysely, SqliteDialect, type Generated, type Insertable } from 'kysely';
import { z } from 'zod';
import log from '../../log.js';

export type Article = {
	id: string;
	article_id: string;
	feed_id: Feed['id'];
	title?: string | null;
	link?: string | null;
	published: bigint;
	content?: string | null;
};

type DbFeed = {
	id: string;
	url: string;
	title: string;
	type: Generated<'rss' | 'atom'>;
	last_update: Generated<number>;
	disabled?: 0 | 1 | null;
	icon?: string | null;
	html_url?: string | null;
};

export const FeedSchema = z.object({
	id: z.string(),
	url: z.string(),
	title: z.string(),
	type: z.literal('rss').or(z.literal('atom')),
	last_update: z.number(),
	disabled: z.optional(z.literal(0).or(z.literal(1)).or(z.null())),
	icon: z.optional(z.string().or(z.null())),
	html_url: z.optional(z.string().or(z.null()))
});
export type Feed = z.infer<typeof FeedSchema>;

export type InsertableFeed = Insertable<DbFeed>;

export const FeedGroupSchema = z.object({
	id: z.string(),
	user_id: z.string(),
	name: z.string()
});
export type FeedGroup = z.infer<typeof FeedGroupSchema>;

export const FeedGroupFeedSchema = z.object({
	feed_group_id: z.string(),
	feed_id: z.string()
});
export type FeedGroupFeed = z.infer<typeof FeedGroupFeedSchema>;

export type Password = {
	hash: string;
	user_id: string;
};

export type Session = {
	id: string;
	data: string;
	expires: number;
	user_id: User['id'];
};

export type User = {
	id: string;
	email: string;
	username: string;
	config?: string | null;
};

export type UserArticle = {
	user_id: User['id'];
	article_id: Article['id'];
	read?: 0 | 1 | null;
	saved?: 0 | 1 | null;
};

export type Database = {
	article: Article;
	feed: DbFeed;
	feed_group: FeedGroup;
	feed_group_feed: FeedGroupFeed;
	password: Password;
	session: Session;
	user: User;
	user_article: UserArticle;
};

const db = new Kysely<Database>({
	dialect: new SqliteDialect({
		database: async () => {
			const dbFile = process.env.DB_FILE;
			if (!dbFile) {
				throw new Error('The DB_FILE environment variable must be defined');
			}
			log.debug(`Connecting to database ${dbFile}`);
			return sqlite3(dbFile);
		}
	})
});

export default db;
