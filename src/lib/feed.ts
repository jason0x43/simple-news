import type { Feed, FeedStats } from './db/feed';
import type { FeedGroupWithFeeds } from './db/feedgroup';
import type { ArticleFilter } from './types';

/**
 * Get the number of articles from a list of feeds that match a filter
 */
export function getArticleCount(
	feeds: Feed[],
	feedStats: FeedStats,
	articleFilter: ArticleFilter
): number {
	const count = feeds.reduce((acc, feed) => {
		const stats = feedStats.feeds[feed.id] ?? {};
		return (
			acc +
			(articleFilter === 'unread' ? stats.total - stats.read : stats.total)
		);
	}, 0);
	return count;
}

/**
 * Return true if all feed IDs are in a given group
 */
export function allFeedsAreSelected(
	group: FeedGroupWithFeeds,
	feedIds: Feed['id'][]
): boolean {
	return group.feeds.every(({ id }) => feedIds.includes(id));
}

/**
 * Return true if some feed IDs are in a given group
 */
export function someFeedsAreSelected(
	group: FeedGroupWithFeeds,
	feedIds: Feed['id'][]
) {
	return group.feeds.some(({ id }) => feedIds.includes(id));
}
