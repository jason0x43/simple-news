import type { FeedGroupWithFeeds, FeedId, FeedStats } from "$server";

/**
 * Return true if all feed IDs are in a given group
 */
export function allFeedsAreSelected(
	group: FeedGroupWithFeeds,
	feedIds: FeedId[],
): boolean {
	return (
		group.feed_ids.length > 0 &&
		group.feed_ids.every((id) => feedIds.includes(id))
	);
}

/**
 * Return true if some feed IDs are in a given group
 */
export function someFeedsAreSelected(
	group: FeedGroupWithFeeds,
	feedIds: FeedId[],
) {
	return (
		group.feed_ids.length > 0 &&
		group.feed_ids.some((id) => feedIds.includes(id))
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
		return `${diff.weeks}w`;
	}
	if (diff.days) {
		return `${diff.days}d`;
	}
	if (diff.hours) {
		return `${diff.hours}h`;
	}
	return `${diff.minutes}m`;
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
		(event instanceof MouseEvent && event.type === "click") ||
		(event instanceof TouchEvent && event.type === "touchend") ||
		(event instanceof KeyboardEvent && event.key === "Enter")
	);
}

/**
 * Get the value of an HTML form element event
 */
export function getEventValue(event: Event): string | undefined {
	const target = event.currentTarget;
	if (
		target instanceof HTMLInputElement ||
		target instanceof HTMLSelectElement
	) {
		return target.value;
	}
}

/**
 * Return a given number of minutes in milliseconds
 */
export function seconds(count: number): number {
	return count * 1000;
}

/**
 * Return a given number of minutes in milliseconds
 */
export function minutes(count: number): number {
	return count * seconds(60);
}

/**
 * Return the number of saved articles in a FeedStats object
 */
export function getSavedCount(stats: FeedStats): number {
	let saved = 0;
	for (const feedId in stats) {
		saved += stats[feedId]?.saved ?? 0;
	}
	return saved;
}

/**
 * Find or create a hash link target
 */
export function verifyHashLinkTarget(
	link: string,
	root: HTMLElement | undefined,
): void {
	if (!link.startsWith("#") || !root) {
		return;
	}

	const target = root.querySelector(link);
	if (!target) {
		for (const h of document.querySelectorAll("h1, h2, h3, h4")) {
			const id = textToId(h.textContent);
			if (id && `#${id}` === link) {
				h.id = id;
				break;
			}
		}
	}
}

/**
 * Convert text to a link ID
 */
function textToId(text: string | null): string | null {
	if (!text) {
		return text;
	}

	return text
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^a-z0-9-]/g, "");
}
