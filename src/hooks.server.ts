import { building } from '$app/environment';
import { getSession } from '$lib/session';
import type { Handle } from '@sveltejs/kit';
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
	const { cookies } = event;
	event.locals.session = await getSession(cookies);

	return resolve(event);
};
