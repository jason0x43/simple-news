import { log } from "../deps.ts";
import { query } from "./db.ts";
import { Article, DbArticle } from "../../types.ts";

export type DbArticleRow = [
  number,
  number,
  string,
  string,
  string,
  number,
  string,
];

export function rowToDbArticle(row: DbArticleRow): DbArticle {
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
  const rows = query<DbArticleRow>(
    `INSERT INTO articles (
      feed_id, article_id, title, link, published, content
    )
    VALUES (:feedId, :articleId, :title, :link, :published, :content)
    RETURNING *`,
    article,
  );
  return rowToDbArticle(rows[0]);
}

export function getArticle(articleId: string): DbArticle {
  const rows = query<DbArticleRow>(
    "SELECT * FROM articles WHERE article_id = (:articleId)",
    { articleId },
  );
  if (!rows[0]) {
    throw new Error(`No article with articleId ${articleId}`);
  }
  return rowToDbArticle(rows[0]);
}

export function getArticleCount(feedId: number): number {
  const rows = query<[number]>(
    "SELECT COUNT(*) FROM articles WHERE feed_id = (:feedId)",
    { feedId },
  );
  return rows[0][0];
}

export function getLatestArticle(feedId: number): DbArticle | undefined {
  const rows = query<DbArticleRow>(
    "SELECT * FROM articles WHERE feed_id = (:feedId) ORDER BY published DESC LIMIT 1",
    { feedId },
  );
  if (rows.length === 0) {
    return undefined;
  }
  return rowToDbArticle(rows[0]);
}

export function setArticleContent(id: number, content: string) {
  query("UPDATE articles SET content = (:content) WHERE id = (:id)", {
    id,
    content,
  });
}

export function hasArticle(articleId: string): boolean {
  const rows = query<DbArticleRow>(
    "SELECT id FROM articles WHERE article_id = (:articleId)",
    { articleId },
  );
  return rows.length > 0;
}
