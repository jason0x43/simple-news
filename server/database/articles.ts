import { log } from "../../deps.ts";
import { query } from "./db.ts";
import { Article } from "../../types.ts";

type ArticleRow = [
  number,
  number,
  string,
  string,
  string,
  number,
  string,
  string,
];

function rowToArticle(row: ArticleRow): Article {
  const [id, feedId, articleId, title, link, published, content, summary] = row;
  return {
    id,
    feedId,
    articleId,
    title,
    link,
    published,
    content,
    summary,
  };
}

export function addArticle(article: Omit<Article, "id">): Article {
  log.debug(`Adding article ${article.articleId}`);
  const rows = query<ArticleRow>(
    `INSERT INTO articles (
      feed_id, article_id, title, link, published, content, summary
    )
    VALUES (:feedId, :articleId, :title, :link, :published, :content, :summary)
    RETURNING *`,
    article,
  );
  return rowToArticle(rows[0]);
}

export function getArticle(articleId: string): Article {
  const rows = query<ArticleRow>(
    "SELECT * FROM articles WHERE article_id = (:articleId)",
    { articleId },
  );
  if (!rows[0]) {
    throw new Error(`No article with articleId ${articleId}`);
  }
  return rowToArticle(rows[0]);
}

export function getArticleCount(feedId: number): number {
  const rows = query<[number]>(
    "SELECT COUNT(*) FROM articles WHERE feed_id = (:feedId)",
    { feedId },
  );
  return rows[0][0];
}

export function getLatestArticle(feedId: number): Article | undefined {
  const rows = query<ArticleRow>(
    "SELECT * FROM articles WHERE feed_id = (:feedId) ORDER BY published DESC LIMIT 1",
    { feedId },
  );
  if (rows.length === 0) {
    return undefined;
  }
  return rowToArticle(rows[0]);
}

export interface GetArticlesOpts {
  // feed to get articles for
  feedId?: number;
  // only return articles that haven't been read by the given user
  userId?: number;
}

export function getArticles(opts?: GetArticlesOpts): Article[] {
  let rows: ArticleRow[];

  if (opts?.feedId !== undefined && opts?.userId !== undefined) {
    rows = query<ArticleRow>(
      `SELECT * FROM articles
      WHERE id NOT IN
      (SELECT article_id
       FROM user_articles
       WHERE user_id = (:userId) AND feed_id = (:feedId) AND read = 1)
      ORDER BY published ASC`,
      { ...opts },
    );
  } else if (opts?.feedId !== undefined) {
    rows = query<ArticleRow>(
      "SELECT * FROM articles WHERE feed_id = (:feedId) ORDER BY published ASC",
      { ...opts },
    );
  } else if (opts?.userId !== undefined) {
    rows = query<ArticleRow>(
      `SELECT * FROM articles
      WHERE id NOT IN
      (SELECT article_id
       FROM user_articles
       WHERE user_id = (:userId) AND read = 1)
      ORDER BY published ASC`,
      { ...opts },
    );
  } else {
    rows = query<ArticleRow>("SELECT * FROM articles ORDER BY published ASC");
  }

  if (rows.length === 0) {
    return [];
  }

  return rows.map(rowToArticle);
}

export function hasArticle(articleId: string): boolean {
  const rows = query<ArticleRow>(
    "SELECT id FROM articles WHERE article_id = (:articleId)",
    { articleId },
  );
  return rows.length > 0;
}
