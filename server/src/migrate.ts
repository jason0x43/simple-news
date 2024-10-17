import { FileMigrationProvider, Kysely, Migrator } from "kysely";
import * as path from "node:path";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runMigrations(db: Kysely<any>) {
	const migrator = new Migrator({
		db,
		provider: new FileMigrationProvider({
			fs,
			path,
			migrationFolder: path.join(__dirname, "migrations"),
		}),
	});

	const resultSet = await migrator.migrateToLatest();

	for (const result of resultSet.results ?? []) {
		if (result.status === "Success") {
			console.log(`applied migration ${result.migrationName}`);
		} else {
			console.log(
				`applying migration ${result.migrationName} failed: ${resultSet.error}`,
			);
		}
	}

	if (resultSet.error) {
		throw resultSet.error;
	}
}
