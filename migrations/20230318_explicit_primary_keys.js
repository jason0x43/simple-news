/* eslint-disable @typescript-eslint/no-explicit-any */

import { sql } from 'kysely';

/** @typedef {import('kysely').Kysely<any>} Kysely */

/**
 * @param {Kysely} db
 * @returns {Promise<void>}
 */
export async function up(db) {
	await db.schema.alterTable('feed_group').renameTo('old_feed_group').execute();

	// recreate feed_group table with an explicit primary key
	await db.schema
		.createTable('feed_group')
		.addColumn('id', 'text', (col) => col.notNull().primaryKey())
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

	await db
		.insertInto('feed_group')
		.expression((db) => db.selectFrom('old_feed_group').selectAll())
		.execute();

	await db.schema
		.alterTable('feed_group_feed')
		.renameTo('old_feed_group_feed')
		.execute();

	// Add more constraints to the feed_group_feed table:
	//   -- a feed can only be added to a group once
	//   -- a feed can only be added for a user once

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
		.addColumn('user_id', 'text', (col) =>
			col
				.notNull()
				.references('user.id')
				.onDelete('cascade')
				.onUpdate('no action')
		)
		.addUniqueConstraint('unique_feeds_in_group', ['feed_group_id', 'feed_id'])
		.addUniqueConstraint('unique_feeds_for_user', ['user_id', 'feed_id'])
		.execute();

	await db
		.insertInto('feed_group_feed')
		.columns(['feed_group_id', 'feed_id', 'user_id'])
		.expression((db) =>
			db
				.selectFrom('old_feed_group_feed')
				.innerJoin(
					'feed_group',
					'feed_group.id',
					'old_feed_group_feed.feed_group_id'
				)
				.select(['feed_group_id', 'feed_id', 'feed_group.user_id'])
		)
		.execute();

	await db.schema.dropTable('old_feed_group_feed').execute();
	await db.schema.dropTable('old_feed_group').execute();
}

/**
 * @param {Kysely} db
 * @returns {Promise<void>}
 */
export async function down(db) {
	// Disable foreign key checks because the previous schema doesn't have an
	// explicit row ID on the feed_group_feed table
	await sql`PRAGMA foreign_keys = 0`.execute(db);

	await db.schema.alterTable('feed_group').renameTo('old_feed_group').execute();

	// recreate feed_group table with an explicit primary key
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

	await db
		.insertInto('feed_group')
		.expression((db) => db.selectFrom('old_feed_group').selectAll())
		.execute();

	await db.schema
		.alterTable('feed_group_feed')
		.renameTo('old_feed_group_feed')
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
		.addUniqueConstraint('unique_subscription', ['feed_group_id', 'feed_id'])
		.execute();

	await db
		.insertInto('feed_group_feed')
		.expression((db) =>
			db.selectFrom('old_feed_group_feed').select(['feed_group_id', 'feed_id'])
		)
		.execute();

	await db.schema.dropTable('old_feed_group_feed').execute();
	await db.schema.dropTable('old_feed_group').execute();

	await sql`PRAGMA foreign_keys = 1`.execute(db);
}
