export const ssr = false;

import { Api } from "$lib/api.server.js";
import { error, redirect } from "@sveltejs/kit";
import { HTTPException } from "@jason0x43/reader-client";

export async function load({ url, depends, locals, fetch }) {
	if (!locals.sessionId) {
		throw redirect(303, `/login?next=${url.pathname}`);
	}

	const api = new Api({ fetch, sessionId: locals.sessionId });

	try {
		depends("app:feeds");
		const feeds = await api.getFeeds();
		depends("app:feedGroups");
		const feedGroups = await api.getFeedGroups();
		depends("app:feedStats");
		const feedStats = await api.getFeedStats();

		return { feeds, feedGroups, feedStats };
	} catch (err) {
		if (err instanceof HTTPException) {
			if (err.status === 401) {
				return redirect(303, `/login?next=${url.pathname}`);
			}

			return error(err.status, { message: err.message });
		}

		return error(500, `${err}`);
	}
}
