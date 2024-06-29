// See https://kit.svelte.dev/docs/types#app

import type {
	Article,
	Feed,
	FeedStats,
	FeedGroupWithFeeds,
} from "simple-news-types";

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			sessionId: string | undefined;
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
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
