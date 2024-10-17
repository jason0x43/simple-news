// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import type { ColumnType, Selectable, Insertable, Updateable } from "kysely";

/** Identifier type for public.feed */
export type FeedId = string & { __brand: "FeedId" };

/** Represents the table public.feed */
export default interface FeedTable {
	id: ColumnType<FeedId, FeedId, FeedId>;

	url: ColumnType<string, string, string>;

	title: ColumnType<string, string, string>;

	kind: ColumnType<string, string | undefined, string>;

	disabled: ColumnType<boolean, boolean, boolean>;

	icon: ColumnType<string | null, string | null, string | null>;

	html_url: ColumnType<string | null, string | null, string | null>;
}

export type Feed = Selectable<FeedTable>;

export type NewFeed = Insertable<FeedTable>;

export type FeedUpdate = Updateable<FeedTable>;
