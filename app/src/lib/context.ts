import { getContext, setContext } from "svelte";
import type { Readable, Writable } from "svelte/store";
import type { ArticleFilter } from "./types";

type AppContext = {
	root: Readable<HTMLElement>;
	managingFeeds: Writable<boolean>;
	articleFilter: Readable<ArticleFilter>;
	updatedArticleIds: Writable<Set<string>>;
};

export function getAppContext<K extends keyof AppContext>(
	key: K,
): AppContext[K] {
	return getContext(key);
}

export function setAppContext<K extends keyof AppContext>(
	key: K,
	value: AppContext[K],
) {
	setContext(key, value);
}
