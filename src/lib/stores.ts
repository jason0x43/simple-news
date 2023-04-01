import { writable } from 'svelte/store';
import type { Article, ArticleWithUserData } from './db/article';
import type { Feed, FeedStats } from './db/feed';
import type { FeedGroupWithFeeds } from './db/feedgroup';
import type { ArticleFilter } from './types';

export function createStores() {
	return {
		/** The filter applied to the set of loaded article headings */
		articleFilter: writable<ArticleFilter>('unread'),

		/** The currently loaded articles */
		articles: writable<ArticleWithUserData[]>([]),

		/** What the app is being displayed on */
		displayType: writable<'mobile' | 'desktop'>('desktop'),

		/** The user's feed groups */
		feedGroups: writable<FeedGroupWithFeeds[]>([]),

		/** Stats for the user's feeds */
		feedStats: writable<FeedStats>({ feeds: {}, saved: 0 }),

		/** All available feeds */
		feeds: writable<Feed[]>([]),

		/** True if the feed management UI should be active */
		managingFeeds: writable<boolean>(false),

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
