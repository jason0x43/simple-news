import { browser } from '$app/environment';
import type { ZodType } from 'zod';

/**
 * Replace HTML entities with their literal values
 */
export function unescapeHtml(text: string): string {
	return text
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}

/**
 * Load a value from session storage
 */
export function loadValue<T>(key: string, parser?: ZodType<T>): T | undefined {
	if (!browser) {
		return;
	}
	const valStr = window.sessionStorage.getItem(`simple-news:${key}`);
	if (valStr) {
		const val = JSON.parse(valStr);
		return parser ? parser.parse(val) : (val as T);
	}
	return undefined;
}

/**
 * Store a value in session storage
 */
export function storeValue<T>(key: string, value: T): void {
	if (!browser) {
		return;
	}
	window.sessionStorage.setItem(`simple-news:${key}`, JSON.stringify(value));
}

/**
 * Clear a value from session storage
 */
export function clearValue(key: string): void {
	if (!browser) {
		return;
	}
	window.sessionStorage.removeItem(`simple-news:${key}`);
}

/**
 * Clear all values from session storage
 */
export function clearStorage(): void {
	if (!browser) {
		return;
	}
	const keys: string[] = [];
	for (let i = 0; i < window.sessionStorage.length; i++) {
		keys.push(window.sessionStorage.key(i) as string);
	}
	const appKeys = keys.filter((k) => /^simple-news:/.test(k));
	for (const key of appKeys) {
		window.sessionStorage.removeItem(key);
	}
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
 * Return true if a given event is a primary action event
 */
export function isActionEvent(event: Event) {
	return (
		(event instanceof MouseEvent && event.type === 'click') ||
		(event instanceof KeyboardEvent && event.key === 'Enter')
	);
}

/**
 * Return true if a given string is a valid URL
 */
export function isValidUrl(url: string | undefined): boolean {
	if (!url) {
		return false;
	}

	try {
		const u = new URL(url);
		return Boolean(u);
	} catch (error) {
		return false;
	}
}
