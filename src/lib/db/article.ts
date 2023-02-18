import { createId } from '@paralleldrive/cuid2';
import type { Transaction } from 'kysely';
import db from './lib/db.js';
import type { Article, Database, Feed, User, UserArticle } from './lib/db';

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
	filter
}: {
	feedIds?: Feed['id'][];
	articleIds?: Article['id'][];
	userId: User['id'];
	filter?: string;
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
			'UserArticle.read',
			'UserArticle.saved'
		]);

	if (feedIds) {
		query = query.where('feedId', 'in', feedIds);
	}
	if (articleIds) {
		query = query.where('articleId', 'in', articleIds);
	}

	const articles = await query.orderBy('published', 'asc').execute();

	// TODO: perform filtering in db query
	if (filter === 'unread') {
		return articles.filter((a) => !a.read);
	}

	if (filter === 'read') {
		return articles.filter((a) => a.read);
	}

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
