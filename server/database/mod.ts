import { DB, log } from "../deps.ts";
import { closeDb, createDb, getDb, inTransaction, query } from "./db.ts";

export { inTransaction };
export {
  addUser,
  getUser,
  getUserByEmail,
  isUserPassword,
  updateUserConfig,
  updateUserPassword,
} from "./users.ts";
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
  getArticle,
  getArticleCount,
  getArticleHeadings,
  getArticles,
  hasArticle,
  setArticleContent,
} from "./articles.ts";
export {
  getReadArticleIds,
  getUserArticles,
  updateUserArticles,
} from "./user_articles.ts";
export { getFeedStats } from "./queries.ts";

export function openDatabase(name = "data.db") {
  try {
    getDb();
  } catch {
    createDb(name);
    migrateDatabase(9);
    log.debug(`Database using v${getSchemaVersion()} schema`);
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

type Migration = {
  up: (db: DB) => void;
  down: (db: DB) => void;
};

// DB version is index + 1
const migrations: Migration[] = [
  {
    // initial database structure
    up: (db) => {
      inTransaction(() => {
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
      });
    },

    down: (db) => {
      inTransaction(() => {
        db.query(`DROP TABLE user_articles`);
        db.query(`DROP TABLE articles`);
        db.query(`DROP TABLE feeds`);
        db.query(`DROP TABLE users`);
      });
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
      inTransaction(() => {
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
      });
      db.query("PRAGMA foreign_keys = ON");
    },

    down: (db) => {
      db.query("PRAGMA foreign_keys = OFF");
      inTransaction(() => {
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
      });
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
    },
  },

  {
    // add password to user
    up: (db) => {
      db.query("ALTER TABLE users ADD COLUMN password TEXT");
    },

    down: (db) => {
      db.query("ALTER TABLE users DROP COLUMN password");
    },
  },

  {
    // fix htmlUrl column name
    up: (db) => {
      inTransaction(() => {
        db.query("ALTER TABLE feeds ADD COLUMN html_url TEXT");
        db.query("UPDATE feeds SET html_url = htmlUrl");
        db.query("ALTER TABLE feeds DROP COLUMN htmlUrl");
      });
    },

    down: (db) => {
      inTransaction(() => {
        db.query("ALTER TABLE feeds ADD COLUMN htmlUrl TEXT");
        db.query("UPDATE feeds SET htmlUrl = html_url");
        db.query("ALTER TABLE feeds DROP COLUMN html_url");
      });
    },
  },

  {
    // add sessions
    up: (db) => {
      inTransaction(() => {
        db.query(
          `CREATE TABLE sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            expires INTEGER NOT NULL
          )`,
        );
      });
    },

    down: (db) => {
      inTransaction(() => {
        db.query("DROP TABLE sessions");
      });
    },
  },
];
