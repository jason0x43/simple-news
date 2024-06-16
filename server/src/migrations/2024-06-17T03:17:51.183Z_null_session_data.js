import { Kysely } from "kysely";

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function up(db) {
	await db.schema
		.alterTable("session")
		.alterColumn("data", (col) => col.dropNotNull())
		.execute();
}

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function down(db) {
	await db.schema
		.alterTable("session")
		.alterColumn("data", (col) => col.setNotNull())
		.execute();
}
