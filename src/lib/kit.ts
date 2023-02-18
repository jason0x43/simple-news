import { json as skJson } from '@sveltejs/kit';

/**
 * A json wrapper that doesn't accept promises
 */
export function json<T>(
	data: T extends PromiseLike<unknown> ? never : T,
	responseInit?: ResponseInit | undefined
) {
	return skJson(data, responseInit);
}
