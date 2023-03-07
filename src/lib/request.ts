import type { ZodType } from 'zod';
import { ResponseError } from './error';

/**
 * Make a POST request
 */
export async function post<T = unknown, R = unknown>(
	path: string,
	data: T,
	parser?: ZodType<R>
): Promise<R> {
	const resp = await fetch(path, {
		method: 'POST',
		credentials: 'include',
		body: JSON.stringify(data),
		headers: {
			'content-type': 'application/json'
		}
	});

	if (resp.status >= 400) {
		const body = await resp.text();
		throw new ResponseError('POST', path, resp.status, resp.statusText, body);
	}

	const body = await resp.json();

	if (parser) {
		return parser.parse(body);
	}

	return body as R;
}

/**
 * Make a PUT request
 */
export async function put<T = unknown, R = unknown>(
	path: string,
	data: T,
	parser?: ZodType<R>
): Promise<R> {
	const resp = await fetch(path, {
		method: 'PUT',
		credentials: 'include',
		body: JSON.stringify(data),
		headers: {
			'content-type': 'application/json'
		}
	});

	if (resp.status >= 400) {
		const body = await resp.text();
		throw new ResponseError('PUT', path, resp.status, resp.statusText, body);
	}

	const body = await resp.json();

	if (parser) {
		return parser.parse(data);
	}

	return body as R;
}

/**
 * Make a GET request
 */
export async function get<T = unknown>(
	url: string,
	parser?: ZodType<T>
): Promise<T> {
	const resp = await fetch(url);
	const data = await resp.json();
	if (parser) {
		return parser.parse(data);
	}
	return data as T;
}
