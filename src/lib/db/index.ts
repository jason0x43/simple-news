import sqlite3, { type Database } from 'better-sqlite3';

export type { Database };

let db: Database | undefined;

export function getDb() {
  if (!db) {
    db = sqlite3('data.db');
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
