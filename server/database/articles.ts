import { log } from "../deps.ts";
import { Article } from "../../types.ts";
import { query } from "./db.ts";
import { count, createRowHelpers, parameterize } from "./util.ts";

const {
  columns: articleColumns,
  query: articleQuery,
} = createRowHelpers<
  Article
>()(
  "id",
  "feedId",
  "articleId",
  "title",
  "link",
  "published",
  "content",
);

export function getArticles(feedIds?: number[]) {
  if (feedIds) {
    const { names: feedParamNames, values: feedParams } = parameterize(
      "feedIds",
      feedIds,
    );
    return articleQuery(
      `SELECT ${articleColumns}
      FROM articles
      WHERE feed_id IN (${feedParamNames.join(",")})
      ORDER BY published ASC`,
      feedParams,
    );
  }

  return articleQuery("SELECT ${articleColumns} FROM articles");
}

export function addArticle(article: Omit<Article, "id">): Article {
  log.debug(`Adding article ${article.articleId}`);
  return articleQuery(
    `INSERT INTO articles (
      feed_id, article_id, title, link, published, content
    )
    VALUES (:feedId, :articleId, :title, :link, :published, :content)
    RETURNING ${articleColumns}`,
    article,
  )[0];
}

export function getArticle(articleId: string): Article {
  const article = articleQuery(
    `SELECT ${articleColumns} FROM articles WHERE article_id = (:articleId)`,
    { articleId },
  )[0];
  if (!article) {
    throw new Error(`No article with articleId ${articleId}`);
  }
  return article;
}

export function getArticleCount(feedId: number): number {
  return count("SELECT COUNT(*) FROM articles WHERE feed_id = (:feedId)", {
    feedId,
  });
}

export function getLatestArticle(feedId: number): Article | undefined {
  return articleQuery(
    `SELECT ${articleColumns}
    FROM articles
    WHERE feed_id = (:feedId)
    ORDER BY published DESC
    LIMIT 1`,
    { feedId },
  )[0];
}

export function setArticleContent(id: number, content: string) {
  query("UPDATE articles SET content = (:content) WHERE id = (:id)", {
    id,
    content,
  });
}

export function hasArticle(articleId: string): boolean {
  return count(
    "SELECT COUNT(*) FROM articles WHERE article_id = (:articleId)",
    { articleId },
  ) > 0;
}
