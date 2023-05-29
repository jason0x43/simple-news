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

/**
 * Return the data from a response
 */
export async function responseJson<T>(response: Promise<Response>): Promise<T> {
	const resp = await response;

	if (resp.status >= 400) {
		throw new Error(await resp.text());
	}

	return (await resp.json()) as T;
}
