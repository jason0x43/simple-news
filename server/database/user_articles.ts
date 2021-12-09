import { getDb, query } from "./db.ts";

export interface UserArticle {
  id: number;
  userId: number;
  articleId: number;
  read: boolean;
  saved: boolean;
}

type UserArticleRow = [number, number, number, boolean, boolean];

function rowToUserArticle(row: UserArticleRow): UserArticle {
  const [id, userId, articleId, read, saved] = row;
  return { id, userId, articleId, read, saved };
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
  query('BEGIN TRANSACTION');

  const statement = getDb().prepareQuery(
    `UPDATE user_articles
    SET read = (:read)
    WHERE user_id = (:userId) AND article_id = (:articleId)`,
  );

  for (const patch of patches) {
    statement.execute({ userId, ...patch });
  }

  query('END TRANSACTION');
}

export function setArticlesSaved(
  userId: number,
  patches: { articleId: number; saved: boolean }[],
) {
  query('BEGIN TRANSACTION');

  const statement = getDb().prepareQuery(
    `UPDATE user_articles
    SET saved = (:saved)
    WHERE user_id = (:userId) AND article_id = (:articleId)`,
  );

  for (const patch of patches) {
    statement.execute({ userId, ...patch });
  }

  query('END TRANSACTION');
}
