/*
  Warnings:

  - You are about to alter the column `expires` on the `Session` table. The data in that column could be lost. The data in that column will be cast from `Int` to `DateTime`.
  - You are about to alter the column `published` on the `Article` table. The data in that column could be lost. The data in that column will be cast from `Int` to `DateTime`.
  - You are about to alter the column `lastUpdate` on the `Feed` table. The data in that column could be lost. The data in that column will be cast from `Int` to `DateTime`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
INSERT INTO "new_Session" ("data", "expires", "id", "userId") SELECT "data", "expires", "id", "userId" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
CREATE TABLE "new_Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "title" TEXT,
    "link" TEXT,
    "published" DATETIME NOT NULL,
    "content" TEXT,
    CONSTRAINT "Article_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feed" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
INSERT INTO "new_Article" ("articleId", "content", "feedId", "id", "link", "published", "title") SELECT "articleId", "content", "feedId", "id", "link", "published", "title" FROM "Article";
DROP TABLE "Article";
ALTER TABLE "new_Article" RENAME TO "Article";
CREATE UNIQUE INDEX "Article_feedId_articleId_key" ON "Article"("feedId", "articleId");
CREATE TABLE "new_Feed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'rss',
    "lastUpdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disabled" BOOLEAN,
    "icon" TEXT,
    "htmlUrl" TEXT
);
INSERT INTO "new_Feed" ("disabled", "htmlUrl", "icon", "id", "lastUpdate", "title", "type", "url") SELECT "disabled", "htmlUrl", "icon", "id", "lastUpdate", "title", "type", "url" FROM "Feed";
DROP TABLE "Feed";
ALTER TABLE "new_Feed" RENAME TO "Feed";
CREATE UNIQUE INDEX "Feed_url_key" ON "Feed"("url");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
