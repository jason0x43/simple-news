import type { GetFeedStatsResponse } from 'src/routes/api/feedstats/+server';
import type { Writable } from 'svelte/store';
import { getAppContext } from './contexts';
import type { FeedStats } from './db/feed';
import type { FeedGroupWithFeeds } from './db/feedgroup';
import type { Feed } from './db/schema';
import type { ArticleFilter } from './db/session';

/**
 * Get the number of articles from a list of feeds that match a filter
 */
export function getArticleCount(
  feeds: Feed[],
  feedStats: FeedStats,
  articleFilter: ArticleFilter
): number {
  const count = feeds.reduce((acc, feed) => {
    const stats = feedStats[feed.id] ?? {};
    return (
      acc +
      (articleFilter === 'unread' ? stats.total - stats.read : stats.total)
    );
  }, 0);
  return count;
}

/**
 * Get the feeds identified by a feed group
 */
export function getGroupFeeds(
  group: FeedGroupWithFeeds,
  feeds: Feed[]
): Feed[] {
  const groupFeeds: Feed[] = [];
  for (const feedGroupFeed of group.feeds) {
    const feed = feeds.find(({ id }) => id === feedGroupFeed.id);
    if (feed) {
      groupFeeds.push(feed);
    }
  }
  return groupFeeds;
}

/**
 * Return true if all the item IDs are contained in the given list of IDs
 */
export function areIdentified<T>(
  items: { id: T }[],
  ids: T[] | undefined
): boolean {
  if (!ids) {
    return false;
  }
  return items.every(({ id }) => ids.includes(id));
}

/**
 * Update the feedStats store
 */
export async function updateFeedStats(feedStats: Writable<FeedStats>) {
  try {
    const resp = await fetch('/api/feedstats');
    const data = (await resp.json()) as GetFeedStatsResponse;
    feedStats.set(data);
  } catch (error) {
    console.warn(`Error updating feed stats: ${error}`);
  }
}
