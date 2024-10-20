import { Api } from "$lib/api.server.js";
import type {
	ArticleSummary,
	FeedGroupId,
	FeedId,
} from "@jason0x43/reader-types";

export async function load({ params, fetch, depends, locals }) {
	depends("app:articles");

	const feedOrGroupId = params.feed_id;
	const api = new Api({ sessionId: locals.sessionId, fetch });

	let articles: ArticleSummary[];

	if (feedOrGroupId === "saved") {
		articles = await api.getSavedArticles();
	} else {
		const [type, id] = feedOrGroupId.split("-");
		if (type === "group") {
			articles = await api.getFeedGroupArticles(id as FeedGroupId);
		} else {
			articles = await api.getFeedArticles(id as FeedId);
		}
	}

	return { feedId: feedOrGroupId, articles };
}
