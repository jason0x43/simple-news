import { writable } from 'svelte/store';
import type { ArticleHeadingWithUserData } from './db/article';
import type { FeedStats } from './db/feed';
import type { FeedGroupWithFeeds } from './db/feedgroup';
import type { Article } from './db/article';
import type { Feed } from './db/feed';
import type { ArticleFilter } from './types';

export function createStores() {
	return {
		/** The filter applied to the set of loaded article headings */
		articleFilter: writable<ArticleFilter>('unread'),

		/** The currently loaded article headings */
		articles: writable<ArticleHeadingWithUserData[]>([]),

		/** What the app is being displayed on */
		displayType: writable<'mobile' | 'desktop'>('desktop'),

		/** The user's feed groups */
		feedGroups: writable<FeedGroupWithFeeds[]>([]),

		/** The active feed or feed group ID */
		feedId: writable<string | undefined>(),

		/** The display name for the active feed or feed group */
		feedName: writable<string>(),

		/** Stats for the user's feeds */
		feedStats: writable<FeedStats>({ feeds: {}, saved: 0 }),

		/** All available feeds */
		feeds: writable<Feed[]>([]),

		/** True if the feed management UI should be active */
		managingFeeds: writable<boolean>(false),

		/** ID of the selected article */
		selectedArticleId: writable<Article['id'] | undefined>(),

		/** IDs of the feeds in the active feed group, or the active feed ID */
		selectedFeedIds: writable<Feed['id'][]>([]),

		/** True if the sidebar should be visible */
		sidebarVisible: writable<boolean>(),

		/**
		 * IDs of articles that have been updated in the current set of active
		 * feeds
		 */
		updatedArticleIds: writable<{ [key: Article['id']]: boolean }>({}),

		/**
		 * The user's subscribed feeds
		 */
		userFeeds: writable<Feed[]>([])
	};
}

export type AppStores = ReturnType<typeof createStores>;
