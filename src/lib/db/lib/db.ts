import sqlite3 from 'better-sqlite3';
import {
	Kysely,
	SqliteDialect,
	type Generated,
	type Insertable,
	type Selectable
} from 'kysely';
import { z } from 'zod';

export const version = 1;

export type Article = {
	id: string;
	articleId: string;
	feedId: Feed['id'];
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
	lastUpdate: Generated<number>;
	disabled?: 0 | 1 | null;
	icon?: string | null;
	htmlUrl?: string | null;
};

export const FeedSchema = z.object({
	id: z.string(),
	url: z.string(),
	title: z.string(),
	type: z.literal('rss').or(z.literal('atom')),
	lastUpdate: z.number(),
	disabled: z.optional(z.literal(0).or(z.literal(1)).or(z.null())),
	icon: z.optional(z.string().or(z.null())),
	htmlUrl: z.optional(z.string().or(z.null()))
});
export type Feed = z.infer<typeof FeedSchema>;

export type InsertableFeed = Insertable<DbFeed>;

export const FeedGroupSchema = z.object({
	id: z.string(),
	userId: z.string(),
	name: z.string()
});
export type FeedGroup = z.infer<typeof FeedGroupSchema>;

export const FeedGroupFeedSchema = z.object({
	feedGroupId: z.string(),
	feedId: z.string()
});
export type FeedGroupFeed = z.infer<typeof FeedGroupFeedSchema>;

export type Password = {
	hash: string;
	userId: string;
};

export type Session = {
	id: string;
	data: string;
	expires: number;
	userId: User['id'];
};

export type User = {
	id: string;
	email: string;
	username: string;
	config?: string | null;
};

export type UserArticle = {
	userId: User['id'];
	articleId: Article['id'];
	read?: 0 | 1 | null;
	saved?: 0 | 1 | null;
};

export type Database = {
	Article: Article;
	Feed: DbFeed;
	FeedGroup: FeedGroup;
	FeedGroupFeed: FeedGroupFeed;
	Password: Password;
	Session: Session;
	User: User;
	UserArticle: UserArticle;
};

const db = new Kysely<Database>({
	dialect: new SqliteDialect({
		database: async () => {
			if (!process.env.DB_FILE) {
				throw new Error('The DB_FILE environment variable must be defined');
			}
			return sqlite3(process.env.DB_FILE);
		}
	})
});

export default db;
