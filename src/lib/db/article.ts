import type { ArticleFilter } from '$lib/types';
import { createId } from '@paralleldrive/cuid2';
import type { Transaction } from 'kysely';
import type { Article, Database, Feed, User, UserArticle } from './lib/db';
import db from './lib/db.js';

export type { Article };

export type ArticleHeading = Pick<
	Article,
	'id' | 'feedId' | 'articleId' | 'title' | 'link' | 'published'
>;

export type ArticleUserData = Omit<UserArticle, 'userId' | 'articleId'>;

export type ArticleHeadingWithUserData = Omit<Article, 'content'> &
	ArticleUserData;

export type ArticleWithUserData = Article & Partial<ArticleUserData>;

export async function getArticle({
	id,
	userId
}: {
	id: Article['id'];
	userId: User['id'];
}): Promise<ArticleWithUserData | null> {
	const article = await db
		.selectFrom('Article')
		.selectAll()
		.where('id', '=', id)
		.executeTakeFirst();
	if (!article) {
		return null;
	}

	const userArticle = await db
		.selectFrom('UserArticle')
		.select(['read', 'saved'])
		.where('userId', '=', userId)
		.where('articleId', '=', id)
		.executeTakeFirst();

	return {
		...article,
		...userArticle
	};
}

export async function getArticleHeadings({
	feedIds,
	articleIds,
	userId,
	filter,
	maxAge
}: {
	feedIds?: Feed['id'][];
	articleIds?: Article['id'][];
	userId: User['id'];
	/** Only return read or unread articles */
	filter?: ArticleFilter;
	/** Maximum age of articles in milliseconds */
	maxAge?: number;
}): Promise<ArticleHeadingWithUserData[]> {
	let query = db
		.selectFrom('Article')
		.leftJoin('UserArticle', (join) =>
			join
				.onRef('UserArticle.articleId', '=', 'Article.id')
				.on('UserArticle.userId', '=', userId)
		)
		.select([
			'id',
			'feedId',
			'Article.articleId',
			'title',
			'link',
			'published',
			'read',
			'saved'
		]);

	if (feedIds) {
		query = query.where('feedId', 'in', feedIds);
	}

	if (articleIds) {
		query = query.where('articleId', 'in', articleIds);
	}

	if (filter === 'unread') {
		query = query.where('read', 'is not', 1);
	}

	if (maxAge) {
		const cutoff = BigInt(Date.now() - maxAge);
		query = query.where('published', '>', cutoff);
	}

	// sort in descending order by publish date for maxAge, then sort the
	// result in ascending order
	const articles = await query.orderBy('published', 'desc').execute();
	articles.sort((a, b) => Number(a.published - b.published));

	return articles;
}

async function internalMarkArticleRead(
	d: typeof db | Transaction<Database>,
	{
		id,
		userId,
		read
	}: {
		id: Article['id'];
		userId: User['id'];
		read: boolean;
	}
): Promise<void> {
	await d
		.insertInto('UserArticle')
		.values({
			userId,
			articleId: id,
			read: read ? 1 : 0
		})
		.onConflict((conflict) =>
			conflict.columns(['userId', 'articleId']).doUpdateSet({
				read: read ? 1 : 0
			})
		)
		.execute();
}

export async function markArticleRead(data: {
	id: Article['id'];
	userId: User['id'];
	read: boolean;
}): Promise<void> {
	await internalMarkArticleRead(db, data);
}

export async function markArticlesRead({
	articleIds,
	userId,
	read
}: {
	articleIds: Article['id'][];
	userId: User['id'];
	read: boolean;
}): Promise<void> {
	await db.transaction().execute(async (trx) => {
		for (const id of articleIds) {
			await internalMarkArticleRead(trx, { userId, id, read });
		}
	});
}

type ArticleUpsert = Pick<
	Article,
	'articleId' | 'feedId' | 'content' | 'title' | 'link' | 'published'
>;

export async function upsertArticle(data: ArticleUpsert): Promise<void> {
	await db
		.insertInto('Article')
		.values({
			id: createId(),
			...data
		})
		.onConflict((conflict) =>
			conflict.columns(['articleId', 'feedId']).doUpdateSet({
				content: data.content,
				title: data.title,
				link: data.link,
				published: data.published
			})
		)
		.executeTakeFirst();
}

export async function deleteArticles(
	articleIds: Article['id'][]
): Promise<void> {
	await db
		.deleteFrom('Article')
		.where('articleId', 'in', articleIds)
		.executeTakeFirst();
}

export async function deleteFeedArticles(feedId: Feed['id']): Promise<void> {
	await db
		.deleteFrom('Article')
		.where('feedId', '=', feedId)
		.executeTakeFirst();
}
