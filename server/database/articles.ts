import { log } from "../deps.ts";
import { query } from "./db.ts";
import { DbArticle } from "../../types.ts";

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

function rowToArticle(row: ArticleRow): DbArticle {
  const [id, feedId, articleId, title, link, published, content] = row;
  return {
    id,
    feedId,
    articleId,
    title,
    link,
    published,
    content,
  };
}

export function addArticle(article: Omit<DbArticle, "id">): DbArticle {
  log.debug(`Adding article ${article.articleId}`);
  const rows = query<ArticleRow>(
    `INSERT INTO articles (
      feed_id, article_id, title, link, published, content
    )
    VALUES (:feedId, :articleId, :title, :link, :published, :content)
    RETURNING *`,
    article,
  );
  return rowToArticle(rows[0]);
}

export function getArticle(articleId: string): DbArticle {
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

export function getLatestArticle(feedId: number): DbArticle | undefined {
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
  // feeds to get articles for
  feedIds?: number[];
  // only return articles that haven't been read by the given user
  userId?: number;
}

export function getArticles(opts?: GetArticlesOpts): DbArticle[] {
  let rows: ArticleRow[];

  if (opts?.feedIds !== undefined) {
    const feedParams: { [name: string]: string | number } = {};
    for (let i = 0; i < opts.feedIds.length; i++) {
      feedParams[`feedIds${i}`] = opts.feedIds[i];
    }
    const feedParamNames = Object.keys(feedParams).map((name) => `:${name}`);
    const baseQuery = `SELECT * FROM articles
        WHERE feed_id IN (${feedParamNames.join(",")})`;

    if (opts?.userId !== undefined) {
      rows = query<ArticleRow>(
        baseQuery + `AND id NOT IN (
          SELECT article_id
          FROM user_articles
          WHERE user_id = (:userId)
          AND feed_id IN (${feedParamNames.join(",")})
          AND read = 1
        ) ORDER BY published ASC`,
        { userId: opts.userId, ...feedParams },
      );
    } else {
      rows = query<ArticleRow>(
        baseQuery + "ORDER BY published ASC",
        feedParams,
      );
    }
  } else if (opts?.userId !== undefined) {
    rows = query<ArticleRow>(
      `SELECT * FROM articles
      WHERE id NOT IN (
        SELECT article_id
        FROM user_articles
        WHERE user_id = (:userId) AND read = 1
      ) ORDER BY published ASC`,
      { userId: opts.userId },
    );
  } else {
    rows = query<ArticleRow>("SELECT * FROM articles ORDER BY published ASC");
  }

  if (rows.length === 0) {
    return [];
  }

  return rows.map(rowToArticle);
}

export function setArticleContent(id: number, content: string) {
  query("UPDATE articles SET content = (:content) WHERE id = (:id)", {
    id,
    content,
  });
}

export function hasArticle(articleId: string): boolean {
  const rows = query<ArticleRow>(
    "SELECT id FROM articles WHERE article_id = (:articleId)",
    { articleId },
  );
  return rows.length > 0;
}
