import sqlite3, { type Database } from 'better-sqlite3';
import { runMigrations } from './migrations.js';

export type { Database };

let db: Database | undefined;

export function getDb() {
	if (!process.env.DB_FILE) {
		throw new Error('The DB_FILE environment variable must be defined');
	}

	if (!db) {
		db = sqlite3(process.env.DB_FILE);
		runMigrations(db);
	}
	return db;
}

export const prepare: Database['prepare'] = (source) => {
	const db = getDb();
	return db.prepare(source);
};

export const transaction: Database['transaction'] = (queries: () => void) => {
	const db = getDb();
	return db.transaction(queries);
};
