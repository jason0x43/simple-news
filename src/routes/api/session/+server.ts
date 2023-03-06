import { setSessionData } from '$lib/db/session';
import { getSessionOrThrow } from '$lib/session';
import { SessionDataSchema, type UpdateSessionRequest } from '$lib/types';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Update session data
 */
export const PUT: RequestHandler = async function ({ locals, request }) {
	const session = getSessionOrThrow(locals);
	let data: UpdateSessionRequest;

	try {
		data = SessionDataSchema.parse(await request.json());
	} catch (err) {
		throw error(400, 'An articleFilter must be provided');
	}

	try {
		await setSessionData(session.id, data);
	} catch (err) {
		throw error(500, `${err}`);
	}

	return new Response();
};
