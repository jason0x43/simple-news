import { Kysely } from "kysely";

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function up(db) {
	await db.schema.alterTable("users").renameTo("account").execute();

	await db.schema
		.alterTable("user_articles")
		.renameTo("account_article")
		.execute();
	await db.schema
		.alterTable("account_article")
		.renameColumn("user_id", "account_id")
		.execute();

	await db.schema.alterTable("sessions").renameTo("session").execute();
	await db.schema
		.alterTable("session")
		.renameColumn("user_id", "account_id")
		.execute();

	await db.schema.alterTable("passwords").renameTo("password").execute();
	await db.schema
		.alterTable("password")
		.renameColumn("user_id", "account_id")
		.execute();

	await db.schema.alterTable("feeds").renameTo("feed").execute();

	await db.schema.alterTable("feed_logs").renameTo("feed_log").execute();

	await db.schema.alterTable("feed_groups").renameTo("feed_group").execute();
	await db.schema
		.alterTable("feed_group")
		.renameColumn("user_id", "account_id")
		.execute();

	await db.schema
		.alterTable("feed_group_feeds")
		.renameTo("feed_group_feed")
		.execute();

	await db.schema.alterTable("articles").renameTo("article").execute();
}

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function down(db) {
	await db.schema.alterTable("account").renameTo("users").execute();

	await db.schema
		.alterTable("account_article")
		.renameTo("user_articles")
		.execute();
	await db.schema
		.alterTable("user_articles")
		.renameColumn("account_id", "user_id")
		.execute();

	await db.schema.alterTable("session").renameTo("sessions").execute();
	await db.schema
		.alterTable("sessions")
		.renameColumn("account_id", "user_id")
		.execute();

	await db.schema.alterTable("password").renameTo("passwords").execute();
	await db.schema
		.alterTable("passwords")
		.renameColumn("account_id", "user_id")
		.execute();

	await db.schema.alterTable("feed").renameTo("feeds").execute();

	await db.schema.alterTable("feed_log").renameTo("feed_logs").execute();

	await db.schema.alterTable("feed_group").renameTo("feed_groups").execute();
	await db.schema
		.alterTable("feed_groups")
		.renameColumn("account_id", "user_id")
		.execute();

	await db.schema
		.alterTable("feed_group_feed")
		.renameTo("feed_group_feeds")
		.execute();

	await db.schema.alterTable("article").renameTo("articles").execute();
}
