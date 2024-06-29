import { Kysely } from "kysely";

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function up(db) {
	const tables = await db.introspection.getTables();

	if (!tables.find((table) => table.name === "users")) {
		await db.schema
			.createTable("users")
			.addColumn("id", "text", (col) => col.primaryKey())
			.addColumn("email", "text", (col) => col.unique().notNull())
			.addColumn("username", "text", (col) => col.unique().notNull())
			.addColumn("config", "jsonb")
			.execute();
	}

	if (!tables.find((table) => table.name === "passwords")) {
		await db.schema
			.createTable("passwords")
			.addColumn("id", "text", (col) => col.primaryKey())
			.addColumn("user_id", "text", (col) =>
				col.notNull().references("users.id"),
			)
			.addColumn("hash", "text", (col) => col.notNull())
			.addColumn("salt", "text", (col) => col.notNull())
			.execute();
	}

	if (!tables.find((table) => table.name === "sessions")) {
		await db.schema
			.createTable("sessions")
			.addColumn("id", "text", (col) => col.primaryKey())
			.addColumn("user_id", "text", (col) =>
				col.notNull().references("users.id"),
			)
			.addColumn("data", "jsonb", (col) => col.notNull())
			.addColumn("expires", "timestamptz", (col) => col.notNull())
			.execute();
	}

	if (!tables.find((table) => table.name === "feeds")) {
		await db.schema
			.createTable("feeds")
			.addColumn("id", "text", (col) => col.primaryKey())
			.addColumn("url", "text", (col) => col.unique().notNull())
			.addColumn("title", "text", (col) => col.notNull())
			.addColumn("kind", "text", (col) => col.notNull().defaultTo("rss"))
			.addColumn("disabled", "boolean", (col) => col.notNull())
			.addColumn("icon", "text")
			.addColumn("html_url", "text")
			.execute();
	}

	if (!tables.find((table) => table.name === "articles")) {
		await db.schema
			.createTable("articles")
			.addColumn("id", "text", (col) => col.primaryKey())
			.addColumn("article_id", "text", (col) => col.notNull())
			.addColumn("feed_id", "text", (col) =>
				col.notNull().references("feeds.id"),
			)
			.addColumn("title", "text", (col) => col.notNull())
			.addColumn("content", "text", (col) => col.notNull())
			.addColumn("published", "timestamptz", (col) => col.notNull())
			.addColumn("link", "text")
			.addUniqueConstraint("unique_feed_article", ["article_id", "feed_id"])
			.execute();
	}

	if (!tables.find((table) => table.name === "user_articles")) {
		await db.schema
			.createTable("user_articles")
			.addColumn("id", "text", (col) => col.primaryKey())
			.addColumn("user_id", "text", (col) =>
				col.notNull().references("users.id"),
			)
			.addColumn("article_id", "text", (col) =>
				col.notNull().references("articles.id"),
			)
			.addColumn("read", "boolean", (col) => col.notNull().defaultTo(false))
			.addColumn("saved", "boolean", (col) => col.notNull().defaultTo(false))
			.addUniqueConstraint("unique_user_article", ["user_id", "article_id"])
			.execute();
	}

	if (!tables.find((table) => table.name === "feed_groups")) {
		await db.schema
			.createTable("feed_groups")
			.addColumn("id", "text", (col) => col.primaryKey())
			.addColumn("user_id", "text", (col) =>
				col.notNull().references("users.id"),
			)
			.addColumn("name", "text", (col) => col.notNull())
			.addUniqueConstraint("unique_user_name", ["user_id", "name"])
			.execute();
	}

	if (!tables.find((table) => table.name === "feed_group_feeds")) {
		await db.schema
			.createTable("feed_group_feeds")
			.addColumn("feed_group_id", "text", (col) =>
				col.notNull().references("feed_groups.id"),
			)
			.addColumn("feed_id", "text", (col) =>
				col.notNull().references("feeds.id"),
			)
			.execute();
	}

	if (!tables.find((table) => table.name === "feed_logs")) {
		await db.schema
			.createTable("feed_logs")
			.addColumn("id", "text", (col) => col.primaryKey())
			.addColumn("feed_id", "text", (col) =>
				col.notNull().references("feeds.id"),
			)
			.addColumn("time", "timestamptz", (col) => col.notNull())
			.addColumn("success", "boolean", (col) => col.notNull())
			.addColumn("message", "text")
			.execute();
	}
}

/**
 * @param {Kysely<any>} db
 * @returns {Promise<void>}
 */
export async function down(db) {
	await db.schema.dropTable("feed_logs").execute();
	await db.schema.dropTable("feed_group_feeds").execute();
	await db.schema.dropTable("feed_groups").execute();
	await db.schema.dropTable("user_articles").execute();
	await db.schema.dropTable("articles").execute();
	await db.schema.dropTable("feeds").execute();
	await db.schema.dropTable("sessions").execute();
	await db.schema.dropTable("passwords").execute();
	await db.schema.dropTable("users").execute();
}
