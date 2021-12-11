import { getDb, inTransaction, query } from "./db.ts";
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

function updateFlags<Flag extends "read" | "saved">(
  flagName: Flag,
  userId: number,
  patches: ({ articleId: number } & { [F in Flag]?: boolean })[],
) {
  const flagPatches = patches.filter((patch) => patch[flagName] !== undefined)
    .map((patch) => ({
      articleId: patch.articleId,
      [flagName]: patch[flagName],
    }));

  const flagStatement = getDb().prepareQuery(
    `INSERT INTO user_articles (user_id, article_id, ${flagName})
    VALUES (:userId, :articleId, :${flagName})
    ON CONFLICT(user_id, article_id)
    DO UPDATE SET ${flagName} = (:${flagName})`,
  );

  for (const patch of flagPatches) {
    flagStatement.execute({ userId, ...patch });
    log.debug(
      `Set article ${patch.articleId}.${flagName} to ${patch[flagName]}`,
    );
  }
}

export function updateArticleFlags(
  userId: number,
  patches: { articleId: number; read?: boolean; saved?: boolean }[],
): void {
  inTransaction(() => {
    updateFlags("read", userId, patches);
    updateFlags("saved", userId, patches);
  });
}
