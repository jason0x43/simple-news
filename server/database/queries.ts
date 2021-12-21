import { prepareQuery } from "./db.ts";
import { FeedStats } from "../../types.ts";
import { getFeedIds } from "./feeds.ts";

export function getFeedStats(
  opts?: {
    userId?: number;
    feedIds?: number[];
  },
): FeedStats {
  const feedIds = opts?.feedIds ?? getFeedIds();
  const stats: FeedStats = {};
  const totalQuery = prepareQuery<[number]>(
    `SELECT COUNT(*) FROM articles WHERE feed_id = (:feedId)`,
  );
  const readQuery = prepareQuery<[number]>(
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
