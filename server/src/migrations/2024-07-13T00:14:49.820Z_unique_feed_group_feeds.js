import { Kysely } from "kysely";

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function up(db) {
	await db.schema
		.alterTable("feed_group_feed")
		.addUniqueConstraint("unique_feed_group_feed", ["feed_group_id", "feed_id"])
		.execute();
}

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function down(db) {
	await db.schema
		.alterTable("feed_group_feed")
		.dropConstraint("unique_feed_group_feed")
		.execute();
}
