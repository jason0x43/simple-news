import type { Article, Feed } from '@prisma/client';
import { writable } from 'svelte/store';
import type { ArticleHeadingWithUserData } from './db/article';
import type { FeedStats } from './db/feed';
import type { FeedGroupWithFeeds } from './db/feedgroup';

export const sidebarVisible = writable<boolean>(false);
export const displayType = writable<'mobile' | 'desktop'>('desktop');
export const updatedArticleIds = writable<Set<Article['id']>>(new Set());
export const articles = writable<ArticleHeadingWithUserData[] | undefined>();
export const feeds = writable<Feed[]>([]);
export const feedGroups = writable<FeedGroupWithFeeds[]>([]);
export const feedStats = writable<FeedStats>({});
export const selectedFeedIds = writable<Feed['id'][]>([]);
