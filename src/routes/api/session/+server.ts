import { setSessionData, type Session } from '$lib/db/session';
import { json } from '$lib/kit';
import { getSessionOrThrow } from '$lib/session';
import {
	SessionDataSchema,
	type SessionData,
	type UpdateSessionRequest
} from '$lib/types';
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

	let updated: Session;

	try {
		updated = await setSessionData(session.id, data);
	} catch (err) {
		throw error(500, `${err}`);
	}

	return json<SessionData>(SessionDataSchema.parse(JSON.parse(updated.data)));
};
