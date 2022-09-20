import type { RequestHandler } from './$types';
import { errorResponse, type ErrorResponse } from '$lib/request';
import { setSessionData, type SessionData } from '$lib/db/session';
import { error } from '@sveltejs/kit';

export type UpdateSessionRequest = SessionData;

export type UpdateSessionResponse = Record<string, never> | ErrorResponse;

/**
 * Update session data
 */
export const PUT: RequestHandler = async function ({ locals, request }) {
	if (!locals.user || !locals.sessionId) {
		throw error(401, 'not logged in');
	}

	const data: UpdateSessionRequest = await request.json();

	if (typeof data.articleFilter !== 'string') {
		return errorResponse({
			feedId: 'An articleFilter must be provided'
		});
	}

	try {
		setSessionData(locals.sessionId, data);
	} catch (err) {
		throw error(500, `${err}`);
	}

	return new Response();
};
