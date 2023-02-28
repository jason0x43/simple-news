import { building } from '$app/environment';
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
