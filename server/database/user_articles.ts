import { getDb, query } from "./db.ts";
import { log } from "../deps.ts";

export interface UserArticle {
  id: number;
  userId: number;
  articleId: number;
  read: boolean;
  saved: boolean;
}

export function getReadArticleIds(userId: number): number[] {
  const rows = query<number[]>(
    "SELECT article_id FROM user_articles WHERE user_id = (:userId)",
    { userId },
  );
  return rows.map((row) => row[0]);
}

export function setArticlesRead(
  userId: number,
  patches: { articleId: number; read: boolean }[],
): void {
  query("BEGIN TRANSACTION");

  const statement = getDb().prepareQuery(
    `INSERT INTO user_articles (user_id, article_id, read)
    VALUES (:userId, :articleId, :read)
    ON CONFLICT(user_id, article_id) DO UPDATE SET read = (:read)`
  );

  for (const patch of patches) {
    statement.execute({ userId, ...patch });
    log.debug(`Set article ${patch.articleId}.read to ${patch.read}`);
  }

  query("END TRANSACTION");
}

export function setArticlesSaved(
  userId: number,
  patches: { articleId: number; saved: boolean }[],
) {
  query("BEGIN TRANSACTION");

  const statement = getDb().prepareQuery(
    `INSERT INTO user_articles (user_id, article_id, saved)
    VALUES (:userId, :articleId, :saved)
    ON CONFLICT(user_id, article_id) DO UPDATE SET saved = (:saved)`
  );

  for (const patch of patches) {
    statement.execute({ userId, ...patch });
  }

  query("END TRANSACTION");
}
