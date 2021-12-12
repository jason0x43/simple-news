import { log } from "../deps.ts";
import { getDb, query } from "./db.ts";
import { Article, DbArticle, FeedStats } from "../../types.ts";
import { DbArticleRow, rowToDbArticle } from "./articles.ts";
import { getFeedIds } from "./feeds.ts";
import { parameterize } from "./util.ts";

export type ArticleRow = [...DbArticleRow, boolean, boolean];

export function rowToArticle(row: ArticleRow): Article {
  const [id, feedId, articleId, title, link, published, content, read, saved] =
    row;
  return {
    id,
    feedId,
    articleId,
    title,
    link,
    published,
    content,
    read,
    saved,
  };
}

export interface GetArticlesOpts {
  // feeds to get articles for
  feedIds?: number[];
  // only return articles that haven't been read by the given user
  userId?: number;
}

export function getArticles(opts?: GetArticlesOpts): Article[] {
  let rows: ArticleRow[];

  if (opts?.feedIds !== undefined) {
    const { names: feedParamNames, values: feedParams } = parameterize(
      "feedIds",
      opts.feedIds,
    );

    if (opts?.userId !== undefined) {
      // The query uses 'IS NOT TRUE' when checking user_articles.read because
      // for cases where this is no user_articles entry for a given article_id,
      // user_articles.read will be NULL
      rows = query<ArticleRow>(
        `SELECT articles.*, user_articles.read, user_articles.saved
        FROM articles
        LEFT JOIN user_articles
          ON articles.id = user_articles.article_id 
          AND user_articles.user_id = (:userId)
        WHERE articles.feed_id IN (${feedParamNames.join(",")})
        ORDER BY published ASC`,
        { userId: opts.userId, ...feedParams },
      );
    } else {
      rows = query<ArticleRow>(
        `SELECT *
        FROM articles
        WHERE feed_id IN (${feedParamNames.join(",")})
        ORDER BY published ASC`,
        feedParams,
      );
    }
  } else if (opts?.userId !== undefined) {
    rows = query<ArticleRow>(
      `SELECT articles.*, user_articles.read, user_articles.saved
      FROM articles
      LEFT JOIN user_articles
        ON articles.id = user_articles.article_id 
        AND user_articles.user_id = (:userId)
      ORDER BY published ASC`,
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

export function getFeedStats(
  opts?: GetArticlesOpts,
): FeedStats {
  const feedIds = opts?.feedIds ?? getFeedIds();
  const stats: FeedStats = {};
  const totalQuery = getDb().prepareQuery<[number]>(
    `SELECT COUNT(*) FROM articles WHERE feed_id = (:feedId)`,
  );
  const readQuery = getDb().prepareQuery<[number]>(
    `SELECT COUNT(*)
    FROM articles
    LEFT JOIN user_articles
      ON articles.id = user_articles.article_id 
      AND user_articles.user_id = (:userId)
    WHERE articles.feed_id = (:feedId)
    AND user_articles.read IS TRUE`,
  );

  for (const feedId of feedIds) {
    const stat = { total: 0, read: 0 };
    const totalRows = totalQuery.all({ feedId });
    stat.total = totalRows[0][0];

    if (opts?.userId) {
      const readRows = readQuery.all({ userId: opts.userId, feedId });
      stat.read = readRows[0][0];
    }
    stats[feedId] = stat;
  }

  return stats;
}
