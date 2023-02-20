import type { RequestHandler } from './$types';
import { errorResponse, type ErrorResponse } from '$lib/request';
import { setSessionData, type SessionData } from '$lib/db/session';
import { error } from '@sveltejs/kit';
import { getSessionOrThrow } from '$lib/session';

export type UpdateSessionRequest = SessionData;
export type UpdateSessionResponse = Record<string, never> | ErrorResponse;

/**
 * Update session data
 */
export const PUT: RequestHandler = async function ({ cookies, request }) {
	const session = await getSessionOrThrow(cookies);
	const data: UpdateSessionRequest = await request.json();

	if (typeof data.articleFilter !== 'string') {
		return errorResponse({
			feedId: 'An articleFilter must be provided'
		});
	}

	try {
		await setSessionData(session.id, data);
	} catch (err) {
		throw error(500, `${err}`);
	}

	return new Response();
};
