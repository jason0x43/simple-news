import { query } from "./db.ts";


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
    'SELECT article_id FROM user_articles WHERE user_id = (:userId)',
    { userId }
  );
  return rows.map((row) => row[0]);
}

export function setArticleRead(
  userId: UserArticle['userId'],
  articleId: UserArticle['articleId'],
  read: boolean,
): UserArticle {
  const rows = query<UserArticleRow>(
    `INSERT INTO user_articles (user_id, article_id, read)
    VALUES (:userId, :articleId, :read)
    ON CONFLICT(user_id, article_id) DO UPDATE SET read = (:read)
    RETURNING *`,
    { userId, articleId, read },
  );
  return rowToUserArticle(rows[0]);
}

export function setArticleSaved(
  article: Omit<UserArticle, "id" | "read" | "saved">,
  saved: boolean,
): UserArticle {
  const rows = query<UserArticleRow>(
    `INSERT INTO user_articles (user_id, article_id, saved)
    VALUES (:userId, :articleId, :saved)
    ON CONFLICT(user_id, article_id) DO UPDATE SET saved = (:saved)
    RETURNING *`,
    { ...article, saved },
  );
  return rowToUserArticle(rows[0]);
}
