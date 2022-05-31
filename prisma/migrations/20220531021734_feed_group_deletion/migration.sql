-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FeedGroupFeed" (
    "feedGroupId" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,

    PRIMARY KEY ("feedGroupId", "feedId"),
    CONSTRAINT "FeedGroupFeed_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feed" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "FeedGroupFeed_feedGroupId_fkey" FOREIGN KEY ("feedGroupId") REFERENCES "FeedGroup" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
INSERT INTO "new_FeedGroupFeed" ("feedGroupId", "feedId") SELECT "feedGroupId", "feedId" FROM "FeedGroupFeed";
DROP TABLE "FeedGroupFeed";
ALTER TABLE "new_FeedGroupFeed" RENAME TO "FeedGroupFeed";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
