import { building } from '$app/environment';
import { getSession } from '$lib/session';
import { text, type Handle } from '@sveltejs/kit';
import { migrateToLatest } from './lib/db/lib/migrate';
import { startDownloader } from './lib/feed.server';
import { setLevel } from './lib/log';

if (!building) {
	setLevel('info');
	if (!process.env.NO_MIGRATE) {
		await migrateToLatest();
	}
	startDownloader();
}

export const handle: Handle = async function ({ event, resolve }) {
	const session = await getSession(event.cookies);

	// protect API paths
	if (event.url.pathname.startsWith('/api') && !session) {
		return text('Not authorized', {
			status: 401
		});
	}

	event.locals.session = session;
	return resolve(event);
};
