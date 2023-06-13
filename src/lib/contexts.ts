import { getContext, setContext } from 'svelte';
import type { Readable, Writable } from 'svelte/store';
import type { ArticleFilter } from './types';
import type { Feed, FeedStats } from './db/feed';
import type { FeedGroupWithFeeds } from './db/feedgroup';
import type { Article, ArticleHeadingWithUserData } from './db/article';

type Contexts = {
	articleFilter: Writable<ArticleFilter>;
	articles: Writable<ArticleHeadingWithUserData[]>;
	displayType: Writable<'mobile' | 'desktop'>;
	feedGroups: Writable<FeedGroupWithFeeds[]>;
	feedStats: Writable<FeedStats>;
	feeds: Writable<Feed[]>;
	managingFeeds: Writable<boolean>;
	onTitlePress: (listener: () => void) => () => void;
	root: Readable<HTMLElement>;
	sidebarVisible: Writable<boolean>;
	updatedArticleIds: Writable<Record<Article['id'], boolean>>;
};

export function getAppContext<K extends keyof Contexts>(key: K): Contexts[K] {
	return getContext(key);
}

export function setAppContext<K extends keyof Contexts>(
	key: K,
	value: Contexts[K]
): Contexts[K] {
	return setContext(key, value);
}
