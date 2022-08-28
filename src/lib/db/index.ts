import sqlite3, { type Database } from 'better-sqlite3';

export type { Database };

let db: Database | undefined;

export function getDb() {
  if (!db) {
    const d = sqlite3('data.db');
    let version = getVersion(d);
    if (typeof version !== 'number') {
      initDb(d);
      version = 0;
    }

    // do migrations

    db = d;
  }
  return db;
}

export function closeDb() {
  db?.close();
  db = undefined;
}

export function transaction(queries: () => void) {
  const db = getDb();
  db.transaction(queries)();
}

function getVersion(d: Database): number | undefined {
  try {
    const ver = d.prepare('SELECT schema_version FROM Meta').get();
    return ver.schema_version;
  } catch (error) {
    return undefined;
  }
}

function initDb(d: Database) {
  db?.transaction(() => {
    d.exec(
      `CREATE TABLE IF NOT EXISTS "Meta" (
      "schema_version" INT NOT NULL
    )`
    );
    d.exec(`INSERT INTO Meta (schema_version) VALUES (0)`);
  })();
}
