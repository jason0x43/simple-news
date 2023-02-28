import sqlite3 from 'better-sqlite3';
import { promises as fs } from 'fs';
import { FileMigrationProvider, Kysely, Migrator, SqliteDialect } from 'kysely';
import * as path from 'path';
import * as url from 'url';
import log from '../../log.js';
import type { Database } from './db.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export async function migrateToLatest() {
	log.info('Starting db migration...');

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
			migrationFolder:
				process.env.DB_MIGRATIONS ||
				path.join(__dirname, '..', '..', '..', '..', 'migrations')
		})
	});

	const { error, results } = await migrator.migrateToLatest();

	results?.forEach((it) => {
		if (it.status === 'Success') {
			log.info(`Migration "${it.migrationName}" was executed successfully`);
		} else if (it.status === 'Error') {
			log.error(`Failed to execute migration "${it.migrationName}"`);
		} else {
			log.error(`Skipped migration "${it.migrationName}" due to earlier error`);
		}
	});

	await db.destroy();

	if (error) {
		log.error('Error running migrations:', error);
		throw error;
	} else {
		log.info('Finished db migration');
	}
}
