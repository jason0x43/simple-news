import { writable } from 'svelte/store';
import type { ArticleHeadingWithUserData } from './db/article';
import type { FeedStats } from './db/feed';
import type { FeedGroupWithFeeds } from './db/feedgroup';
import type { Article, Feed } from './db/schema';

export function createStores() {
  return {
    sidebarVisible: writable<boolean>(false),
    displayType: writable<'mobile' | 'desktop'>('desktop'),
    updatedArticleIds: writable<Set<Article['id']>>(new Set()),
    articles: writable<ArticleHeadingWithUserData[] | undefined>(),
    feeds: writable<Feed[]>([]),
    feedGroups: writable<FeedGroupWithFeeds[]>([]),
    feedStats: writable<FeedStats>({}),
    managingFeeds: writable<boolean>(false),
    selectedFeedIds: writable<Feed['id'][]>([])
  };
}

export type AppStores = ReturnType<typeof createStores>;
