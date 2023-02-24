import { writable } from 'svelte/store';
import type { ArticleHeadingWithUserData } from './db/article';
import type { FeedStats } from './db/feed';
import type { FeedGroupWithFeeds } from './db/feedgroup';
import type { Article } from './db/article';
import type { Feed } from './db/feed';
import type { ArticleFilter } from './types';

export function createStores() {
	return {
		sidebarVisible: writable<boolean>(),
		displayType: writable<'mobile' | 'desktop'>('desktop'),
		updatedArticleIds: writable<Set<Article['id']>>(new Set()),
		articles: writable<ArticleHeadingWithUserData[] | undefined>(),
		articleFilter: writable<ArticleFilter>('unread'),
		feeds: writable<Feed[]>([]),
		feedGroups: writable<FeedGroupWithFeeds[]>([]),
		feedStats: writable<FeedStats>({}),
		managingFeeds: writable<boolean>(false),
		selectedFeedIds: writable<Feed['id'][]>([])
	};
}

export type AppStores = ReturnType<typeof createStores>;
