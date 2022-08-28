CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "config" TEXT
);
CREATE TABLE IF NOT EXISTS "Password" (
    "hash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Password_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE IF NOT EXISTS "UserArticle" (
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "read" BOOLEAN,
    "saved" BOOLEAN,

    PRIMARY KEY ("userId", "articleId"),
    CONSTRAINT "UserArticle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "UserArticle_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE IF NOT EXISTS "FeedGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "FeedGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE IF NOT EXISTS "FeedGroupFeed" (
    "feedGroupId" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,

    PRIMARY KEY ("feedGroupId", "feedId"),
    CONSTRAINT "FeedGroupFeed_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feed" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "FeedGroupFeed_feedGroupId_fkey" FOREIGN KEY ("feedGroupId") REFERENCES "FeedGroup" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "Password_userId_key" ON "Password"("userId");
CREATE UNIQUE INDEX "FeedGroup_userId_name_key" ON "FeedGroup"("userId", "name");
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    TEXT PRIMARY KEY NOT NULL,
    "checksum"              TEXT NOT NULL,
    "finished_at"           DATETIME,
    "migration_name"        TEXT NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"        DATETIME,
    "started_at"            DATETIME NOT NULL DEFAULT current_timestamp,
    "applied_steps_count"   INTEGER UNSIGNED NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "feedId" TEXT NOT NULL,
    "title" TEXT,
    "link" TEXT,
    "published" BIGINT NOT NULL,
    "content" TEXT,
    CONSTRAINT "Article_feedId_fkey" FOREIGN KEY ("feedId") REFERENCES "Feed" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
CREATE UNIQUE INDEX "Article_feedId_articleId_key" ON "Article"("feedId", "articleId");
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT NOT NULL,
    "expires" BIGINT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE TABLE IF NOT EXISTS "Feed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'rss',
    "lastUpdate" BIGINT NOT NULL DEFAULT 0,
    "disabled" BOOLEAN,
    "icon" TEXT,
    "htmlUrl" TEXT
);
CREATE UNIQUE INDEX "Feed_url_key" ON "Feed"("url");
CREATE TABLE IF NOT EXISTS "Meta" (
        "schema_version" INT NOT NULL
      );
