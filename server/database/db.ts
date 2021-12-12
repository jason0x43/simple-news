import { DB } from "../deps.ts";

let dbRef: DB | undefined;

export function getDb(): DB {
  if (!dbRef) {
    throw new Error("Database is not open");
  }
  return dbRef;
}

export function createDb(name = "data.db") {
  dbRef = new DB(name);
}

export function closeDb() {
  dbRef?.close();
  dbRef = undefined;
}

export const query: InstanceType<typeof DB>["query"] = (...args) => {
  const db = getDb();
  return db.query(...args);
};

export function inTransaction<T>(callback: (db: DB) => T): T {
  const db = getDb();
  db.query("BEGIN TRANSACTION");
  try {
    const val = callback(db);
    db.query("COMMIT");
    return val;
  } catch (error) {
    db.query("ROLLBACK");
    throw error;
  }
}
