/**
 * A simple router based on the elegua router:
 * https://github.com/howesteve/elegua
 */

import { derived, get, writable, readonly } from "svelte/store";

export type Params = Record<string, string>;

let shouldIgnoreChange: (() => boolean | undefined) | undefined;
const urlStore = writable<URL>(new URL(location.href));
const oldUrlStore = writable<URL>(new URL(window.location.href));

/**
 * Set the current URL and update the old URL.
 */
function setUrl(url: URL) {
	oldUrlStore.set(get(urlStore));
	urlStore.set(url);
	history.pushState({}, '', `${url}`);
}

const regExpEscape = (s: string) =>
	s.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, "\\$&");

/**
 * Create a parser for a route containing placeholders, like /blog/:slug.
 *
 * If a regex is passed in, it will be returned unchanged.
 *
 * @param route - a route string or regex
 * @returns a regex if the route is a regex or has placeholders, otherwise
 * undefined
 */
function parseRoute(route: string | RegExp): RegExp | undefined {
	if (typeof route !== 'string') {
		return route;
	}

	if (route.indexOf("/:") === -1) {
		return;
	}

	return RegExp(
		route
			.split("/")
			.map((x) =>
				x.startsWith(":")
					? `(?<${regExpEscape(
							x.slice(1, x.length),
					  )}>[a-zA-Z0-9][a-zA-Z0-9\_\-]*)`
					: regExpEscape(x),
			)
			.join(`\\/`),
	);
}

/**
 * A global hook function for preventing routing/page changes.
 *
 * Use this to prevent routing changes using either goto() or <a> clicking on
 * undesirable situations, e.g, when a form is dirty and you want the user to
 * save changes before leaving the form.
 *
 * @param ignoreChange - a function that should return true if changes should
 * be ignored
 */
export function preventChange(ignoreChange?: typeof shouldIgnoreChange) {
	shouldIgnoreChange = ignoreChange;
}

/**
 * Try to match the current URL against a given route.
 *
 * @param path - the path to resolve against
 * @param route - a route string or regex; strings may contain URL params
 * @returns an object of route params, or undefined if the route didn't match
 */
export function matches(
	path: string,
	route: string | RegExp,
): Params | undefined {
	if (route === path) {
		// The route matches the path
		return {}
	}

	const matcher = parseRoute(route);
	if (!matcher) {
		// The route wasn't a regex and had no paramters, and we already know it
		// didn't match the path.
		return;
	}

	const match = matcher.exec(path);
	if (match) {
		return match.groups ? { ...match.groups } : {};
	}
}

/**
 * Navigate to a new url.
 *
 * @param url - a URL to navigate to
 */
export function goto(url: string | URL) {
	if (shouldIgnoreChange?.()) {
		return;
	}
	setUrl(typeof url === "string" ? new URL(url) : url);
}

/**
 * Initialize the router.
 */
export function init() {
	window.addEventListener("load", () => {
		// update state for hashchange events
		window.addEventListener("hashchange", () => {
			setUrl(new URL(window.location.href));
		});

		// update state for URL changes
		window.addEventListener("popstate", (event) => {
			setUrl(new URL(window.location.href));
			event.preventDefault();
		});

		// handle <a> clicks; open ctrl/shift+clicks in another tab/window
		window.addEventListener("click", (event) => {
			let targetElement = event.target as HTMLElement;
			while (targetElement && targetElement !== document.body) {
				if (targetElement.tagName === "A") {
					if (shouldIgnoreChange?.()) {
						// Ignore the click
						return event.preventDefault();
					}

					if (
						event?.ctrlKey ||
						event?.shiftKey ||
						targetElement.hasAttribute("data-native-router")
					) {
						// Let the browser handle the click
						return;
					}

					const href = targetElement.getAttribute("href") || "";
					if (!/^http?s\:\/\//.test(href)) {
						// Only handle relative URLs
						if (href) {
							setUrl(new URL(href, window.location.href));
						}
						return event.preventDefault();
					}
				}

				targetElement = targetElement.parentElement || document.body;
			}
		});
	});
}

/** The previous URL */
export const oldUrl = readonly(oldUrlStore);

/** The current URL */
export const url = readonly(urlStore);

/** The path of the current URL */
export const path = derived(urlStore, ($url) => $url.pathname);

/** The hash of the current URL */
export const hash = derived(urlStore, ($url) => $url.hash);

/** The search params of the current URL */
export const searchParams = derived(url, ($url) => $url.searchParams);
