// See https://kit.svelte.dev/docs/types#app

import type {
	Article,
	Feed,
	FeedGroupWithFeeds,
	FeedStats,
	SessionId,
} from "@jason0x43/reader-types";

// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			sessionId: SessionId | undefined;
			client: Client | undefined;
		}
		interface PageData {
			feeds: Feed[];
			feedStats: FeedStats;
			feedGroups: FeedGroupWithFeeds[];
			feedId?: string;
			articleId?: string;
			articleId?: string;
			article?: Article;
		}
	}
}

export {};
