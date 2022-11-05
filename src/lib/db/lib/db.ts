import sqlite3, { type Database, type RunResult } from 'better-sqlite3';

export type { Database };

let db: Database | undefined;

function getDb(): Database {
	if (!db) {
		if (!process.env.DB_FILE) {
			throw new Error('The DB_FILE environment variable must be defined');
		}
		db = sqlite3(process.env.DB_FILE);
	}
	return db;
}

export function closeDb() {
	db?.close();
	db = undefined;
}

type Statement<BindParams extends unknown[]> = {
	run(...params: BindParams): RunResult;
	get<T = unknown>(...params: BindParams): T | undefined;
	all<T = unknown>(...params: BindParams): T[];
};

export function prepare<
	// eslint-disable-next-line @typescript-eslint/ban-types
	BindParams extends unknown[] | {} = unknown[],
	Ret = BindParams extends unknown[]
		? Statement<BindParams>
		: Statement<[BindParams]>
>(query: string): Ret {
	return getDb().prepare<BindParams>(query) as Ret;
}

export function transaction(
	transactor: Parameters<Database['transaction']>[0]
) {
	return getDb().transaction(transactor)();
}
