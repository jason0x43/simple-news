import { inTransaction, prepareQuery } from "./db.ts";
import * as log from "std/log/mod.ts";
import { UserArticle } from "../../types.ts";
import { createRowHelpers, parameterize, select } from "./util.ts";

const {
  columns: userArticleColumns,
  query: userArticleQuery,
} = createRowHelpers<
  UserArticle
>()(
  "articleId",
  "read",
  "saved",
);

export function getUserArticles(
  data: { userId: number; feedIds?: number[] },
): UserArticle[] {
  const { userId, feedIds } = data;
  let userArticles: UserArticle[];

  if (feedIds) {
    const { names: feedParamNames, values: feedParams } = parameterize(
      "feedIds",
      feedIds,
    );
    userArticles = userArticleQuery(
      `SELECT ${
        userArticleColumns.split(",").map((col) => `user_articles.${col}`).join(
          ",",
        )
      }
      FROM user_articles
      INNER JOIN articles
        ON articles.id = user_articles.article_id 
        AND articles.feed_id IN  (${feedParamNames.join(",")})
      WHERE user_id = (:userId)`,
      { userId, ...feedParams },
    );
  } else {
    userArticles = userArticleQuery(
      `SELECT ${userArticleColumns}
      FROM user_articles WHERE user_id = (:userId)`,
      { userId: data.userId },
    );
  }

  return userArticles;
}

export function getReadArticleIds(userId: number): number[] {
  return select(
    "SELECT article_id FROM user_articles WHERE user_id = (:userId)",
    (row) => row[0] as number,
    { userId },
  );
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

  const flagStatement = prepareQuery(
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

export function updateUserArticles(
  userId: number,
  patches: { articleId: number; read?: boolean; saved?: boolean }[],
): UserArticle[] {
  inTransaction(() => {
    updateFlags("read", userId, patches);
    updateFlags("saved", userId, patches);
  });

  const articleIds = patches.map(({ articleId }) => articleId);
  return userArticleQuery(
    `SELECT ${userArticleColumns}
    FROM user_articles
    WHERE article_id IN (${articleIds.join(",")})`,
  );
}
