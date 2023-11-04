import type {
	Article,
	ArticleSummary,
	Feed,
	FeedGroup,
	FeedGroupWithFeeds,
	FeedStats,
} from "server";

export async function getFeedGroups(): Promise<FeedGroupWithFeeds[]> {
	const resp = assertOk(await fetch("/api/feedgroups"));
	return resp.json();
}

export async function getFeedStats(): Promise<FeedStats> {
	const resp = assertOk(await fetch("/api/feedstats"));
	return resp.json();
}

export async function getFeeds(): Promise<Feed[]> {
	const resp = assertOk(await fetch("/api/feeds"));
	return resp.json();
}

export type ArticlesSource =
	| { feedId: Feed["id"] }
	| { feedGroupId: FeedGroup["id"] };

export async function getArticles(
	source: ArticlesSource | undefined,
): Promise<ArticleSummary[]> {
	let resp: Response;

	if (source === undefined) {
		resp = assertOk(await fetch(`/api/articles`));
	} else if (isFeedId(source)) {
		resp = assertOk(await fetch(`/api/feeds/${source.feedId}/articles`));
	} else {
		resp = assertOk(
			await fetch(`/api/feedgroups/${source.feedGroupId}/articles`),
		);
	}

	return resp.json();
}

export async function getArticle(id: Article["id"]): Promise<Article> {
	const resp = assertOk(await fetch(`/api/articles/${id}`));
	return resp.json();
}

function isFeedId(value: ArticlesSource): value is { feedId: Feed["id"] } {
	return "feedId" in value;
}

function assertOk(resp: Response): Response {
	if (!resp.ok) {
		throw new Error(resp.statusText);
	}
	return resp;
}
