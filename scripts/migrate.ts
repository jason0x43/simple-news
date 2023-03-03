import sqlite3 from 'better-sqlite3';
import { promises as fs } from 'fs';
import { FileMigrationProvider, Kysely, Migrator, SqliteDialect } from 'kysely';
import * as path from 'path';
import * as url from 'url';
import type { Database } from '../src/lib/db/lib/db';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

async function migrateToLatest() {
	const db = new Kysely<Database>({
		dialect: new SqliteDialect({
			database: async () => {
				if (!process.env.DB_FILE) {
					throw new Error('The DB_FILE environment variable must be defined');
				}
				return sqlite3(process.env.DB_FILE);
			}
		})
	});

	const migrator = new Migrator({
		db,
		provider: new FileMigrationProvider({
			fs,
			path,
			migrationFolder: path.join(__dirname, '..', 'migrations')
		})
	});

	const { error, results } = await migrator.migrateToLatest();

	results?.forEach((it) => {
		if (it.status === 'Success') {
			console.log(`Migration "${it.migrationName}" was executed successfully`);
		} else if (it.status === 'Error') {
			console.error(`Failed to execute migration "${it.migrationName}"`);
		} else {
			console.error(
				`Skipped migration "${it.migrationName}" due to earlier error`
			);
		}
	});

	if (error) {
		console.error('failed to migrate');
		console.error(error);
		process.exit(1);
	}

	await db.destroy();
}

migrateToLatest();
