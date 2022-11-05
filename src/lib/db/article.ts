import cuid from 'cuid';
import * as db from './lib/db.js';
import type { Article, Feed, User, UserArticle } from './schema';

export type ArticleHeading = Pick<
	Article,
	'id' | 'feedId' | 'articleId' | 'title' | 'link' | 'published'
>;

export type ArticleUserData = Omit<UserArticle, 'userId' | 'articleId'>;

export type ArticleHeadingWithUserData = Omit<Article, 'content'> &
	ArticleUserData;

export type ArticleWithUserData = Article & Partial<ArticleUserData>;

export function getArticle({
	id,
	userId
}: {
	id: Article['id'];
	userId: User['id'];
}): ArticleWithUserData | null {
	const article = db
		.prepare<Article['id']>('SELECT * FROM Article WHERE id = ?')
		.get(id) as Article;
	if (!article) {
		return null;
	}

	const userArticle = db
		.prepare<[User['id'], Article['id']]>(
			'SELECT read, saved FROM UserArticle WHERE userId = ? AND articleId = ?'
		)
		.get<Pick<UserArticle, 'read' | 'saved'>>(userId, id);

	return {
		...article,
		...userArticle
	};
}

export function getArticleHeadings({
	feedIds,
	articleIds,
	userId,
	filter
}: {
	feedIds?: Feed['id'][];
	articleIds?: Article['id'][];
	userId: User['id'];
	filter?: string;
}): ArticleHeadingWithUserData[] {
	const wheres: string[] = [];
	const params: unknown[] = [];

	let query = `SELECT id, feedId, Article.articleId, title, link, published, UserArticle.read, UserArticle.saved
    FROM Article
    LEFT JOIN UserArticle
    ON UserArticle.userId = ? AND UserArticle.articleId = Article.id`;
	params.push(userId);

	if (feedIds) {
		wheres.push(`feedId IN (${feedIds.map(() => '?').join(', ')})`);
		params.push(...feedIds);
	}
	if (articleIds) {
		wheres.push(`articleId IN (${articleIds.map(() => '?').join(', ')})`);
		params.push(...articleIds);
	}

	if (wheres.length > 0) {
		query = `${query} WHERE ${wheres.join(' AND ')}`;
	}

	query = `${query} ORDER BY published ASC`;

	const articles: ArticleHeadingWithUserData[] = db
		.prepare(query)
		.all(...params);

	// TODO: perform filtering in db query
	if (filter === 'unread') {
		return articles.filter((a) => !a.read);
	}

	if (filter === 'read') {
		return articles.filter((a) => a.read);
	}

	return articles;
}

export function markArticleRead({
	id,
	userId,
	read
}: {
	id: Article['id'];
	userId: User['id'];
	read: boolean;
}): void {
	db.prepare<{
		userId: User['id'];
		articleId: Article['id'];
		read: ArticleUserData['read'];
	}>(
		`INSERT INTO UserArticle(userId, articleId, read)
		VALUES (@userId, @articleId, @read)
		ON CONFLICT(userId, articleId)
		DO UPDATE SET read = @read`
	).run({
		userId,
		articleId: id,
		read: read ? 1 : 0
	});
}

export function markArticlesRead({
	articleIds,
	userId,
	read
}: {
	articleIds: Article['id'][];
	userId: User['id'];
	read: boolean;
}): void {
	const updater = db.prepare<{
		userId: User['id'];
		articleId: Article['id'];
		read: ArticleUserData['read'];
	}>(
		`INSERT INTO UserArticle(userId, articleId, read)
		VALUES (@userId, @articleId, @read)
		ON CONFLICT(userId, articleId)
		DO UPDATE SET read = @read`
	);

	try {
		db.transaction(() => {
			for (const articleId of articleIds) {
				updater.run({
					userId,
					articleId,
					read: read ? 1 : 0
				});
			}
		});
	} catch (error) {
		console.warn('problem marking articles as read:', error);
	}
}

type ArticleUpsert = Pick<
	Article,
	'articleId' | 'feedId' | 'content' | 'title' | 'link' | 'published'
>;

export function upsertArticle(data: ArticleUpsert): void {
	db.prepare<ArticleUpsert & { id?: Article['id'] }>(
		`INSERT INTO Article (id, articleId, feedId, content, title, link, published)
		VALUES (@id, @articleId, @feedId, @content, @title, @link, @published)
		ON CONFLICT(articleId, feedId)
		DO UPDATE SET content = @content, title = @title, link = @link, published = @published`
	).run({ id: cuid(), ...data });
}

export function deleteArticles(articleIds: Article['id'][]): void {
	db.prepare<Article['id'][]>(
		`DELETE FROM Article WHERE articleId in (${articleIds
			.map(() => '?')
			.join()})`
	).run(...articleIds);
}

export function deleteFeedArticles(feedId: Feed['id']): void {
	db.prepare<Feed['id']>('DELETE FROM Article WHERE feedId = ?').run(feedId);
}
