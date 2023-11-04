/**
 * A simple router heavily based on the elegua router:
 * https://github.com/howesteve/elegua
 */

import type { ComponentType } from "svelte";
import {
	derived,
	get,
	readable,
	writable,
	type Subscriber,
	type Writable,
} from "svelte/store";

type Params = Record<string, string>;
type RouteMatch = {
	match: RegExpExecArray | undefined;
	params: Params;
};

let setPath: Subscriber<string>;
let setHash: Subscriber<string>;
let setUrl: (u: URL) => void;
let setOldUrl: Subscriber<URL>;
let shouldIgnoreChange: (() => boolean | undefined) | undefined;

/**
 * A writable store for the current path. If url is changed, subscribers will
 * be notified; if store value is set, current url will change as well and path
 * will be resolved.
 */
export const path: Writable<string> = (() => {
	const { set, ...store } = writable("");
	setPath = set;
	return {
		...store,
		set: (x: string) => {
			const u = get(url);
			u.pathname = x;
			url.set(u);
			return set(x);
		},
	};
})();

/**
 * A store for the URL hash.
 */
export const hash = (() => {
	const { set, ...store } = writable("");
	setHash = set;
	return {
		...store,
		set: (x: string) => {
			const u = get(url);
			u.hash = x;
			url.set(u);
			return set(x);
		},
	};
})();

/**
 * A store for the full URL
 */
export const url = (() => {
	const { set, ...store } = writable(new URL(window.location.href));

	setUrl = (u: URL) => {
		const sset = u.searchParams.set;
		const sdel = u.searchParams.delete;
		const sapp = u.searchParams.append;
		u.searchParams.set = (name, value) => {
			const res = sset.call(u.searchParams, name, value);
			set(u);
			history.pushState({}, "", u.toString());
			return res;
		};
		u.searchParams.append = (name, value) => {
			const res = sapp.call(u.searchParams, name, value);
			set(u);
			history.pushState({}, "", u.toString());
			return res;
		};
		u.searchParams.delete = (name) => {
			const res = sdel.call(u.searchParams, name);
			set(u);
			history.pushState({}, "", u.toString());
			return res;
		};

		setOldUrl(get(url));
		set(u);

		if (get(path) !== u.pathname) {
			setPath(u.pathname);
		}

		if (get(hash) !== u.hash) {
			setHash(u.hash.slice(1, u.hash.length));
		}
	};

	return {
		...store,
		set: (u: URL) => {
			history.pushState(null, "", u);
			setUrl(u);
		},
	};
})();

/**
 * A store for the previous full url
 */
export const oldUrl = readable<URL>(new URL(window.location.href), (set) => {
	setOldUrl = set;
});

/**
 * A store for the query part of the current URL
 */
export const searchParams = derived(url, (x) => x.searchParams);

const regExpEscape = (s: string) =>
	s.replace(/[-[\]{}()*+!<=:?.\/\\^$|#\s,]/g, "\\$&");

/**
 * Compile a named path such as /blog/:slug into a RegExp.
 *
 * Usually this will not be needed to be called directly since resolve()
 * will detect named paths automatically and call this internally, but
 * it's exported in case you want to use it.
 */
function namedPath(route: string): RegExp {
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

export type DynamicRoute = [string | RegExp, ComponentType, any?];

/**
 * Used to create a dynamic router, like a <Route> component.
 *
 * <svelte:component this={dynamic([routes], error)} />
 *
 * If no route among [routes] is resolved, return the "defaultRoute" route.
 * If defaultRoute is not defined, undefined is returned.
 */
export function dynamic(
	path: string,
	routes: DynamicRoute[],
	defaultRoute?: ComponentType,
): ComponentType | undefined {
	for (let i = 0; i < routes.length; i++) {
		const [route, component] = routes[i];
		if (matches(path, route)) {
			return component;
		}
	}
	return defaultRoute;
}

/**
 * A global hook function for preventing routing/page changes.
 *
 * Use this to prevent routing changes using either goto() or <a> clicking on
 * undesirable situations, e.g, when a form is dirty and you want the user to
 * save changes before leaving the form.
 */
export function preventChange(ignoreChange?: typeof shouldIgnoreChange) {
	shouldIgnoreChange = ignoreChange;
}

/**
 * Try to match the current URL against a given route.
 *
 * @param route - a string (fixed or dynamic) route, or a regexp route. If '/:'
 * is found in the route, it's considered a named route.
 * @param path - an optional param for providing a path to resolve to. Defaults
 * to $path
 */
export function matches(
	path: string,
	route: string | RegExp,
): RouteMatch | undefined {
	if (typeof route === "string") {
		if (route === path) {
			return { match: undefined, params: {} };
		}

		if (route.indexOf("/:") === -1) {
			return;
		}

		route = namedPath(route);
	}

	// trying a regexp match
	const m = route.exec(path);
	if (m) {
		return {
			match: m,
			params: m.groups ? { ...m.groups } : {},
		};
	}
}

/**
 * Navigates to a new url and updates all related stores.
 *
 * @param href - the href/path to to go, ex: '/blog'
 * @param data - unused
 */
export function goto(href: string | URL, _data: unknown = undefined) {
	// preventing changes
	if (shouldIgnoreChange?.()) {
		return;
	}

	url.set(new URL(`${href}`, window.location.href));
}

/**
 * Prevent unloading or focus change
 *
 * If callback returns true, unfocusing is prevented. If callback returns a
 * string, unfocusing is prevented and a message is returned. Note that most
 * browsers will ignore the message.
 */
export function preventUnload(
	node: HTMLElement,
	callback: () => boolean | string | undefined,
) {
	const handler = (ev: BeforeUnloadEvent) => {
		const res = callback();

		if (typeof res === "string") {
			// If callback returns a string, send it to the browser. However as exposed,
			// it's usually ignored by browsers.
			ev.preventDefault();
			ev.returnValue = res;
			return res;
		}

		if (res) {
			// If callback returns a truthy value, show the browser's default
			// confirmation message to ask the user if they want to leave the page.
			ev.preventDefault();
			ev.returnValue = "";
			return "";
		}
	};

	node.addEventListener("beforeunload", handler, { capture: true });

	return {
		destroy() {
			node.removeEventListener("beforeunload", handler);
		},
	};
}

/**
 * Initialize the router.
 */
export function init() {
	get(oldUrl);
	setUrl(new URL(document.location.href));

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
						return event.preventDefault();
					}

					if (
						event?.ctrlKey ||
						event?.shiftKey ||
						targetElement.hasAttribute("data-native-router")
					) {
						return;
					}

					const href = targetElement.getAttribute("href") || "";

					// do not handle external links
					if (!/^http?s\:\/\//.test(href)) {
						if (href) {
							url.set(new URL(href, window.location.href));
						}
						return event.preventDefault();
					}
				}

				targetElement = targetElement.parentElement || document.body;
			}
		});
	});
}
