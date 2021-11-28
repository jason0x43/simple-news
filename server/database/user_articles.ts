import { query } from './db.ts';

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

export function setArticleRead(
  article: Omit<UserArticle, "id" | "read" | "saved">,
  read: boolean,
): UserArticle {
  const rows = query<UserArticleRow>(
    `INSERT INTO user_articles (user_id, article_id, read)
    VALUES (:userId, :articleId, :read)
    ON CONFLICT(user_id, article_id) DO UPDATE SET read = (:read)
    RETURNING *`,
    { ...article, read },
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
