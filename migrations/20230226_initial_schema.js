/* eslint-disable @typescript-eslint/no-explicit-any */

/** @typedef {import('kysely').Kysely<any>} Kysely */

/**
 * @param {Kysely} db
 * @returns {Promise<void>}
 */
export async function up(db) {
	await db.schema
		.createTable('user')
		.addColumn('id', 'text', (col) => col.notNull().primaryKey())
		.addColumn('email', 'text', (col) => col.notNull().unique())
		.addColumn('username', 'text', (col) => col.notNull().unique())
		.addColumn('config', 'text')
		.execute();

	await db.schema
		.createTable('password')
		.addColumn('hash', 'text', (col) => col.notNull())
		.addColumn('user_id', 'text', (col) =>
			col
				.notNull()
				.references('user.id')
				.onDelete('cascade')
				.onUpdate('no action')
		)
		.execute();

	await db.schema
		.createTable('user_article')
		.addColumn('user_id', 'text', (col) =>
			col
				.notNull()
				.references('user.id')
				.onDelete('cascade')
				.onUpdate('no action')
		)
		.addColumn('article_id', 'text', (col) =>
			col
				.notNull()
				.references('article.id')
				.onDelete('cascade')
				.onUpdate('no action')
		)
		.addColumn('read', 'boolean')
		.addColumn('saved', 'boolean')
		.addPrimaryKeyConstraint('user_article_primary_key', [
			'user_id',
			'article_id'
		])
		.execute();

	await db.schema
		.createTable('feed_group')
		.addColumn('id', 'text', (col) => col.notNull())
		.addColumn('name', 'text', (col) => col.notNull())
		.addColumn('user_id', 'text', (col) =>
			col
				.notNull()
				.references('user.id')
				.onDelete('cascade')
				.onUpdate('no action')
		)
		.addUniqueConstraint('feed_group_unique_name', ['name', 'user_id'])
		.execute();

	await db.schema
		.createTable('feed_group_feed')
		.addColumn('feed_group_id', 'text', (col) =>
			col
				.notNull()
				.references('feed_group.id')
				.onDelete('cascade')
				.onUpdate('no action')
		)
		.addColumn('feed_id', 'text', (col) =>
			col
				.notNull()
				.references('feed.id')
				.onDelete('cascade')
				.onUpdate('no action')
		)
		.execute();

	await db.schema
		.createTable('article')
		.addColumn('id', 'text', (col) => col.notNull().primaryKey())
		.addColumn('article_id', 'text', (col) => col.notNull())
		.addColumn('feed_id', 'text', (col) =>
			col
				.notNull()
				.references('feed.id')
				.onDelete('no action')
				.onUpdate('no action')
		)
		.addColumn('title', 'text')
		.addColumn('link', 'text')
		.addColumn('published', 'bigint', (col) => col.notNull())
		.addColumn('content', 'text')
		.addUniqueConstraint('unique_feed_article', ['article_id', 'feed_id'])
		.execute();

	await db.schema
		.createTable('session')
		.addColumn('id', 'text', (col) => col.notNull().primaryKey())
		.addColumn('data', 'text', (col) => col.notNull())
		.addColumn('expires', 'bigint', (col) => col.notNull())
		.addColumn('user_id', 'text', (col) =>
			col
				.notNull()
				.references('user.id')
				.onDelete('cascade')
				.onUpdate('no action')
		)
		.execute();

	await db.schema
		.createTable('feed')
		.addColumn('id', 'text', (col) => col.notNull().primaryKey())
		.addColumn('url', 'text', (col) => col.notNull().unique())
		.addColumn('title', 'text', (col) => col.notNull())
		.addColumn('type', 'text', (col) => col.notNull().defaultTo('rss'))
		.addColumn('last_updated', 'bigint', (col) => col.notNull().defaultTo(0))
		.addColumn('disabled', 'boolean')
		.addColumn('icon', 'text')
		.addColumn('html_url', 'text')
		.execute();
}

/**
 * @returns {Promise<void>}
 */
export async function down() {
	// nothing to do
}
