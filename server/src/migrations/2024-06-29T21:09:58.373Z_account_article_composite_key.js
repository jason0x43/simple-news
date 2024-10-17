/**
 * @template T
 * @typedef {import("kysely").Kysely<T>} Kysely
 */

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function up(db) {
	await db.schema
		.alterTable("account_article")
		.dropConstraint("user_articles_pkey")
		.execute();
	await db.schema
		.alterTable("account_article")
		.renameColumn("id", "_id")
		.execute();
	await db.schema
		.alterTable("account_article")
		.alterColumn("_id", (col) => col.dropNotNull())
		.execute();
	await db.schema
		.alterTable("account_article")
		.addPrimaryKeyConstraint("account_article_pkey", [
			"account_id",
			"article_id",
		])
		.execute();
	await db.schema
		.alterTable("account_article")
		.dropConstraint("user_articles_user_id_article_id_key")
		.ifExists()
		.execute();
}

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function down(db) {
	await db.schema
		.alterTable("account_article")
		.dropConstraint("account_article_pkey")
		.execute();
	await db.schema
		.alterTable("account_article")
		.renameColumn("_id", "id")
		.execute();
	await db.schema
		.alterTable("account_article")
		.alterColumn("id", (col) => col.setNotNull())
		.execute();
	await db.schema
		.alterTable("account_article")
		.addPrimaryKeyConstraint("user_articles_pkey", ["id"])
		.execute();
	await db.schema
		.alterTable("account_article")
		.addUniqueConstraint("user_articles_user_id_article_id_key", [
			"account_id",
			"article_id",
		])
		.execute();
}
