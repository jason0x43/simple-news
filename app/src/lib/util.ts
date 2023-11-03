import type { Feed, FeedGroupWithFeeds } from "server";

/**
 * Return true if all feed IDs are in a given group
 */
export function allFeedsAreSelected(
	group: FeedGroupWithFeeds,
	feedIds: Feed["id"][],
): boolean {
	return (
		group.feeds.length > 0 &&
		group.feeds.every(({ id }) => feedIds.includes(id))
	);
}

/**
 * Return true if some feed IDs are in a given group
 */
export function someFeedsAreSelected(
	group: FeedGroupWithFeeds,
	feedIds: Feed["id"][],
) {
	return (
		group.feeds.length > 0 && group.feeds.some(({ id }) => feedIds.includes(id))
	);
}
