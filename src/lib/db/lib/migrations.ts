import type { Database } from 'better-sqlite3';

type Migration = {
  up: (db: Database) => void;
  down: (db: Database) => void;
};

export function runMigrations(db: Database) {
  const version = getVersion(db);
  for (let i = version + 1; i < migrations.length; i++) {
    migrations[i].up(db);
  }
}

function getVersion(db: Database): number {
  try {
    const ver = db.prepare(`SELECT value FROM Meta WHERE key='version'`).get();
    return Number(ver.value);
  } catch (error) {
    return -1;
  }
}

export const migrations: Migration[] = [
  // Initial migration
  {
    up(db) {
      db.transaction(function () {
        db.prepare(
          `CREATE TABLE IF NOT EXISTS Meta (
            key TEXT NOT NULL PRIMARY KEY,
            value TEXT NOT NULL
          )`
        ).run();

        db.prepare<[string, string]>(
          'INSERT INTO Meta (key, value) VALUES (?, ?)'
        ).run('version', '0');

        db.prepare(
          `CREATE TABLE IF NOT EXISTS User (
            id TEXT NOT NULL PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            username TEXT NOT NULL UNIQUE,
            config TEXT
          )`
        ).run();

        db.prepare(
          `CREATE TABLE IF NOT EXISTS Password (
            hash TEXT NOT NULL,
            userId TEXT NOT NULL UNIQUE,
            FOREIGN KEY (userId) REFERENCES User (id) ON DELETE CASCADE ON UPDATE NO ACTION
          )`
        ).run();

        db.prepare(
          `CREATE TABLE IF NOT EXISTS Session (
            id TEXT NOT NULL PRIMARY KEY,
            data TEXT,
            expires DATETIME NOT NULL,
            userId TEXT NOT NULL,
            FOREIGN KEY (userId) REFERENCES User (id) ON DELETE CASCADE ON UPDATE NO ACTION
          )`
        ).run();

        db.prepare(
          `CREATE TABLE IF NOT EXISTS Feed (
            id TEXT NOT NULL PRIMARY KEY,
            url TEXT NOT NULL UNIQUE,
            title TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'rss',
            lastUpdate BIGINT NOT NULL DEFAULT 0,
            disabled BOOLEAN,
            icon TEXT,
            htmlUrl TEXT
          )`
        ).run();

        db.prepare(
          `CREATE TABLE IF NOT EXISTS Article (
            id TEXT NOT NULL PRIMARY KEY,
            articleId TEXT NOT NULL,
            feedId TEXT NOT NULL,
            title TEXT,
            link TEXT,
            published BIGINT NOT NULL,
            content TEXT,
            FOREIGN KEY (feedId) REFERENCES Feed (id) ON DELETE NO ACTION ON UPDATE NO ACTION
          )`
        ).run();

        db.prepare(
          `CREATE TABLE IF NOT EXISTS UserArticle (
            userId TEXT NOT NULL,
            articleId TEXT NOT NULL,
            read BOOLEAN,
            saved BOOLEAN,
            PRIMARY KEY (userId, articleId),
            FOREIGN KEY (userId) REFERENCES User (id) ON DELETE CASCADE ON UPDATE NO ACTION,
            FOREIGN KEY (articleId) REFERENCES Article (id) ON DELETE CASCADE ON UPDATE NO ACTION
          )`
        ).run();

        db.prepare(
          `CREATE TABLE IF NOT EXISTS FeedGroup (
            id TEXT NOT NULL PRIMARY KEY,
            userId TEXT NOT NULL,
            name TEXT NOT NULL,
            UNIQUE (userId, name),
            FOREIGN KEY (userId) REFERENCES User (id) ON DELETE CASCADE ON UPDATE NO ACTION
          )`
        ).run();

        db.prepare(
          `CREATE TABLE IF NOT EXISTS FeedGroupFeed (
            feedGroupId TEXT NOT NULL,
            feedId TEXT NOT NULL,
            PRIMARY KEY (feedGroupId, feedId),
            FOREIGN KEY (feedId) REFERENCES Feed (id) ON DELETE CASCADE ON UPDATE NO ACTION,
            FOREIGN KEY (feedGroupId) REFERENCES FeedGroup (id) ON DELETE CASCADE ON UPDATE NO ACTION
          )`
        ).run();
      })();
    },

    down(db) {
      db.prepare('DROP TABLE FeedGroupFeed').run();
      db.prepare('DROP TABLE FeedGroup').run();
      db.prepare('DROP TABLE UserArticle').run();
      db.prepare('DROP TABLE Article').run();
      db.prepare('DROP TABLE Feed').run();
      db.prepare('DROP TABLE Session').run();
      db.prepare('DROP TABLE Password').run();
      db.prepare('DROP TABLE User').run();
      db.prepare('DROP TABLE Meta').run();
    }
  }
];
