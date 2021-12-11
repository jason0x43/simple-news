import { DB, log } from "../deps.ts";
import { addUser, getUserByEmail } from "./users.ts";
import { closeDb, createDb, getDb, inTransaction, query } from "./db.ts";

export { inTransaction };
export { getUser, getUserByEmail, updateUserConfig } from "./users.ts";
export {
  addFeed,
  getFeed,
  getFeedByUrl,
  getFeeds,
  setFeedDisabled,
  setFeedIcon,
  setFeedUrl,
} from "./feeds.ts";
export {
  addArticle,
  getArticleCount,
  hasArticle,
  setArticleContent,
} from "./articles.ts";
export { getReadArticleIds, setArticlesRead } from "./user_articles.ts";
export * from "./queries.ts";

export function openDatabase(name = "data.db") {
  try {
    getDb();
  } catch {
    createDb(name);
    log.debug(`Foreign key support: ${getPragma("foreign_keys")}`);
    migrateDatabase(6);
    log.debug(`Database using v${getSchemaVersion()} schema`);

    if (!getUserByEmail("jason@jasoncheatham.com")) {
      addUser({
        name: "Jason",
        email: "jason@jasoncheatham.com",
      });
    }
  }
}

export function closeDatabase() {
  closeDb();
}

function getPragma<T = string>(name: string) {
  const rows = query<[T]>(`PRAGMA ${name}`);
  return rows[0][0];
}

export function getSchemaVersion(): number {
  return getPragma("user_version");
}

export function setSchemaVersion(version: number) {
  query(`PRAGMA user_version = ${version}`);
}

export function migrateDatabase(targetVersion: number) {
  let version = getSchemaVersion();
  const db = getDb();

  while (version < targetVersion) {
    const migration = migrations[version++];
    migration.up(db);
    setSchemaVersion(version);
    log.debug(`Migrated db to schema v${version}`);
  }

  while (version > targetVersion) {
    const migration = migrations[--version];
    migration.down(db);
    setSchemaVersion(version);
    log.debug(`Migrated db to schema v${version}`);
  }
}

interface Migration {
  up: (db: DB) => void;
  down: (db: DB) => void;
}

// DB version is index + 1
const migrations: Migration[] = [
  {
    // initial database structure
    up: (db) => {
      db.query("BEGIN TRANSACTION");

      db.query("PRAGMA foreign_keys = ON");

      db.query(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          name TEXT
          config JSON
        )
      `);

      db.query(`
        CREATE TABLE feeds (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          url TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          type TEXT NOT NULL,
          last_update INTEGER NOT NULL DEFAULT 0
        )
      `);

      db.query(`
        CREATE TABLE articles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          feed_id INTEGER NOT NULL,
          article_id TEXT NOT NULL,
          title TEXT,
          link TEXT,
          published NUMBER,
          content TEXT,
          UNIQUE (feed_id, article_id),
          FOREIGN KEY(feed_id) REFERENCES feeds(id)
        )
      `);

      db.query(`
        CREATE TABLE user_articles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          article_id INTEGER NOT NULL,
          read INTEGER,
          saved INTEGER,
          UNIQUE(user_id, article_id)
          FOREIGN KEY(user_id) REFERENCES users(id),
          FOREIGN KEY(article_id) REFERENCES articles(id)
        )
      `);

      db.query("COMMIT");
    },

    down: (db) => {
      db.query("BEGIN TRANSACTION");
      db.query(`DROP TABLE user_articles`);
      db.query(`DROP TABLE articles`);
      db.query(`DROP TABLE feeds`);
      db.query(`DROP TABLE users`);
      db.query("COMMIT");
    },
  },

  {
    // add htmlUrl to to feeds
    up: (db) => {
      db.query("ALTER TABLE feeds ADD COLUMN htmlUrl TEXT");
    },

    down: (db) => {
      db.query("ALTER TABLE feeds DROP COLUMN htmlUrl");
    },
  },

  {
    // allow feeds to be disabled
    up: (db) => {
      db.query("ALTER TABLE feeds ADD COLUMN disabled BOOLEAN");
    },

    down: (db) => {
      db.query("ALTER TABLE feeds DROP COLUMN disabled");
    },
  },

  {
    // remove summary column from articles
    up: (db) => {
      db.query("ALTER TABLE articles DROP COLUMN summary");
    },

    down: (db) => {
      db.query("ALTER TABLE feeds ADD COLUMN summary TEXT");
    },
  },

  {
    // ensure all articles have a published date
    up: (db) => {
      db.query("PRAGMA foreign_keys = OFF");
      db.query("BEGIN TRANSACTION");
      db.query(
        `CREATE TABLE new_articles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          feed_id INTEGER NOT NULL,
          article_id TEXT NOT NULL,
          title TEXT,
          link TEXT,
          published NUMBER NOT NULL DEFAULT CURRENT_TIMESTAMP,
          content TEXT,
          UNIQUE (feed_id, article_id),
          FOREIGN KEY(feed_id) REFERENCES feeds(id)
        )`,
      );
      db.query("INSERT INTO new_articles SELECT * FROM articles");
      db.query("DROP TABLE articles");
      db.query("ALTER TABLE new_articles RENAME TO articles");
      db.query("COMMIT");
      db.query("PRAGMA foreign_keys = ON");
    },

    down: (db) => {
      db.query("PRAGMA foreign_keys = OFF");
      db.query("BEGIN TRANSACTION");
      db.query(
        `CREATE TABLE old_articles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          feed_id INTEGER NOT NULL,
          article_id TEXT NOT NULL,
          title TEXT,
          link TEXT,
          published NUMBER,
          content TEXT,
          UNIQUE (feed_id, article_id),
          FOREIGN KEY(feed_id) REFERENCES feeds(id)
        )`,
      );
      db.query("INSERT INTO old_articles SELECT * FROM articles");
      db.query("DROP TABLE articles");
      db.query("ALTER TABLE old_articles RENAME TO articles");
      db.query("COMMIT");
      db.query("PRAGMA foreign_keys = ON");
    },
  },

  {
    // add icon to feed
    up: (db) => {
      db.query("ALTER TABLE feeds ADD COLUMN icon TEXT");
    },

    down: (db) => {
      db.query("ALTER TABLE feeds DROP COLUMN icon");
    }
  }
];
