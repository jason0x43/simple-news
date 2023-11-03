import { getContext, setContext } from "svelte";
import type { Readable } from "svelte/store";

type AppContext = {
	root: Readable<HTMLElement>;
};

export function getAppContext<K extends keyof AppContext>(
	key: K,
): AppContext[K] | undefined {
	return getContext(key);
}

export function setAppContext<K extends keyof AppContext>(
	key: K,
	value: AppContext[K],
) {
	setContext(key, value);
}
