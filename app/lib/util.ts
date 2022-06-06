import type { Article, Feed } from '@prisma/client';
import { useMatches } from '@remix-run/react';
import { useMemo } from 'react';
import type { ArticleHeadingWithUserData } from '~/models/article.server';
import type { FeedGroupWithFeeds } from '~/models/feedGroup.server';
import type { UserWithFeeds } from '~/models/user.server';
import type {
  ArticleFilter,
  LoaderData as ReaderLoaderData,
} from '~/routes/reader';
import type { LoaderData as FeedLoaderData } from '~/routes/reader/$feedId';
import type { LoaderData as ArticleLoaderData } from '~/routes/reader/$feedId/$articleId';

export function toObject<T, K extends keyof T>(objArr: T[], key: K) {
  const obj: { [prop: string]: T } = {};
  for (const entry of objArr) {
    const entryKey = entry[key] as unknown as string;
    obj[entryKey] = entry;
  }
  return obj;
}

export function loadValue<T = unknown>(
  name: string,
  defaultValue?: T
): T | undefined {
  const store = globalThis.localStorage;
  const val = store.getItem(name);
  if (val === null) {
    return defaultValue;
  }
  return JSON.parse(val);
}

export function storeValue(name: string, value: unknown) {
  const store = globalThis.localStorage;

  if (value !== undefined) {
    store.setItem(name, JSON.stringify(value));
  } else {
    store.removeItem(name);
  }
}

export function removeValue(name: string) {
  const store = globalThis.localStorage;
  store.removeItem(name);
}

export function preloadFeedIcons(feeds: Feed[]) {
  const preloadIds: string[] = [];
  for (const link of document.head.querySelectorAll('link[data-preload-id]')) {
    preloadIds.push(link.getAttribute('data-preload-id') as string);
  }
  const faviconLinks = feeds
    ?.filter((feed) => feed.icon && !preloadIds.includes(`${feed.id}`))
    .map(({ id, icon }) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = icon as string;
      link.setAttribute('data-preload-id', `${id}`);
      return link;
    });

  for (const link of faviconLinks) {
    document.head.append(link);
  }
}

export function validateEmail(email: unknown): email is string {
  return typeof email === 'string' && email.length > 3 && email.includes('@');
}

function useMatchesData<T = unknown>(id: string): T | undefined {
  const matchingRoutes = useMatches();
  const route = useMemo(
    () => matchingRoutes.find((route) => route.id === id),
    [matchingRoutes, id]
  );
  return route?.data as T | undefined;
}

function isUser(user: any): user is UserWithFeeds {
  return user && typeof user === 'object' && typeof user.email === 'string';
}

export function useUser(): UserWithFeeds {
  const data = useMatchesData<ReaderLoaderData>('routes/reader');
  if (!data || !isUser(data.user)) {
    throw new Error('No user found, but user is required by useUser.');
  }
  return data.user;
}

export function useFeeds(): Feed[] | null {
  const user = useUser();
  return getFeedsFromUser(user);
}

export function useArticles(): ArticleHeadingWithUserData[] | null {
  const feedData = useMatchesData<FeedLoaderData>('routes/reader/$feedId');
  if (feedData) {
    return feedData.articles;
  }
  return [];
}

export function useSelectedFeedIds(): Feed['id'][] {
  const feedData = useMatchesData<FeedLoaderData>('routes/reader/$feedId');
  if (feedData) {
    return feedData.feedIds;
  }
  return [];
}

export function useSelectedArticle(): ArticleLoaderData['article'] {
  const feedArticleData = useMatchesData<ArticleLoaderData>(
    'routes/reader/$feedId/$articleId'
  );
  if (feedArticleData) {
    return feedArticleData.article;
  }
  return null;
}

export function useArticleFilter(): ArticleFilter {
  const data = useMatchesData<ReaderLoaderData>('routes/reader');
  return data?.articleFilter ?? 'unread';
}

export function unescapeHtml(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

export function getFeedsFromGroup(group: FeedGroupWithFeeds): Feed[] {
  const feeds = [];
  for (const groupFeed of group.feeds) {
    feeds.push(groupFeed.feed);
  }
  return feeds;
}

export function getFeedsFromUser(user: UserWithFeeds): Feed[] {
  const feeds = [];
  for (const group of user.feedGroups) {
    feeds.push(...getFeedsFromGroup(group));
  }
  return feeds;
}

export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export function getJson<T>(formData: FormData, key: string): T | null {
  const val = formData.get(key) as string;
  if (val === null) {
    return val;
  }
  return JSON.parse(val) as T;
}
