import { log } from "../deps.ts";
import { getDb, query } from "./db.ts";
import { DbArticle, FeedStats } from "../../types.ts";
import { ArticleRow, rowToArticle } from "./articles.ts";
import { getFeedIds } from "./feeds.ts";

export interface GetArticlesOpts {
  // feeds to get articles for
  feedIds?: number[];
  // only return articles that haven't been read by the given user
  userId?: number;
}

export function getArticles(opts?: GetArticlesOpts): DbArticle[] {
  log.debug(`Getting articles with ${JSON.stringify(opts)}`);
  let rows: ArticleRow[];

  if (opts?.feedIds !== undefined) {
    const feedParams: { [name: string]: string | number } = {};
    for (let i = 0; i < opts.feedIds.length; i++) {
      feedParams[`feedIds${i}`] = opts.feedIds[i];
    }
    const feedParamNames = Object.keys(feedParams).map((name) => `:${name}`);

    if (opts?.userId !== undefined) {
      // The query uses 'IS NOT TRUE' when checking user_articles.read because
      // for cases where this is no user_articles entry for a given article_id,
      // user_articles.read will be NULL
      rows = query<ArticleRow>(
        `SELECT *
        FROM articles
        LEFT JOIN user_articles
          ON articles.id = user_articles.article_id 
          AND user_articles.user_id = (:userId)
        WHERE articles.feed_id IN (${feedParamNames.join(",")})
        AND user_articles.read IS NOT TRUE
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
      `SELECT *
      FROM articles
      LEFT JOIN user_articles
        ON articles.id = user_articles.article_id 
        AND user_articles.user_id = (:userId)
      WHERE user_articles.read IS NOT TRUE
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
