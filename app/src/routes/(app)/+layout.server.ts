export const ssr = false;

import { Api } from "$lib/api.server.js";
import { isArticleFilter, type ArticleFilter } from "$lib/types.js";
import { redirect } from "@sveltejs/kit";

export async function load({ url, depends, locals, fetch }) {
	if (!locals.sessionId) {
		throw redirect(303, `/login?next=${url.pathname}`);
	}

	const filterParam = url.searchParams.get("filter");
	let articleFilter: ArticleFilter = "unread";
	if (isArticleFilter(filterParam)) {
		articleFilter = filterParam;
	}

	const api = new Api({ fetch, sessionId: locals.sessionId });

	depends("app:feeds");
	const feeds = await api.getFeeds();
	depends("app:feedGroups");
	const feedGroups = await api.getFeedGroups();
	depends("app:feedStats");
	const feedStats = await api.getFeedStats();

	return { feeds, feedGroups, feedStats, articleFilter };
}
