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

/**
 * Replace HTML entities with their literal values
 */
export function unescapeHtml(text: string): string {
	return text
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&");
}

/**
 * Return the age of a timestamp in an abbreviated human readable format
 */
export function getAge(
	timestamp: Date | number | string | undefined | null,
): string {
	if (timestamp == null) {
		return "?";
	}

	const date0 = new Date();
	const date1 = new Date(timestamp);
	const diff = diffDates(date0, date1);
	if (diff.weeks) {
		return `${diff.weeks} w`;
	}
	if (diff.days) {
		return `${diff.days} d`;
	}
	if (diff.hours) {
		return `${diff.hours} h`;
	}
	return `${diff.minutes} m`;
}

/**
 * Return the difference between two dates
 */
function diffDates(date1: Date, date2: Date) {
	const start = date1 <= date2 ? date1 : date2;
	const end = date1 > date2 ? date1 : date2;
	const milliseconds = end.getTime() - start.getTime();
	const seconds = Math.floor(milliseconds / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	const weeks = Math.floor(days / 7);

	const yearDiff = end.getFullYear() - start.getFullYear();
	const startMonth = start.getMonth();
	const endMonth = 12 * yearDiff + end.getMonth();
	const months = endMonth - startMonth;

	const years = Math.floor(months / 12);

	return {
		milliseconds,
		seconds,
		minutes,
		hours,
		days,
		weeks,
		months,
		years,
	};
}

/**
 * Return true if a given event is a primary action event
 */
export function isActionEvent(event: Event) {
	return (
		(event instanceof MouseEvent && event.type === 'click') ||
		(event instanceof KeyboardEvent && event.key === 'Enter')
	);
}
