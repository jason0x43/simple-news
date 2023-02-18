import { defaultSessionData } from '$lib/db/session';
import { getSession } from '$lib/session';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const cookie = event.request.headers.get('cookie');
	const session = await getSession(cookie);
	event.locals.user = session?.user;
	event.locals.sessionId = session?.id;
	event.locals.sessionData = session?.data
		? JSON.parse(session.data)
		: defaultSessionData;
	return resolve(event);
};
