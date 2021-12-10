import { query } from "./db.ts";
import { DbArticle, FeedStats } from "../../types.ts";
import { ArticleRow, rowToArticle } from "./articles.ts";
import { getFeedIds } from './feeds.ts';

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

export function getFeedStats(
  opts?: GetArticlesOpts,
): FeedStats {
  const feedIds = opts?.feedIds ?? getFeedIds();
  const stats: FeedStats = {};

  for (const feedId of feedIds) {
    const stat = { total: 0, read: 0 };
    const totalRows = query<[number]>(
      `SELECT COUNT(*) FROM articles WHERE feed_id = (:feedId)`,
      { feedId }
    );
    stat.total = totalRows[0][0];

    if (opts?.userId) {
      const readRows = query<[number]>(
        `SELECT COUNT(*)
        FROM articles
        WHERE id IN (
          SELECT article_id
          FROM user_articles
          WHERE user_id = (:userId) AND feed_id = (:feedId) AND read = 1
        )`,
        { userId: opts.userId, feedId }
      );
      stat.read = readRows[0][0];
    }
    stats[feedId] = stat;
  }

  return stats;
}
