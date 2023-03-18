import type { ArticleHeadingWithUserData } from '$lib/db/article';

export async function get(
	groupId: string
): Promise<ArticleHeadingWithUserData[]> {
	const resp = await fetch(`/api/feedgroups/${groupId}/articles`);
	const rdata = (await resp.json()) as ArticleHeadingWithUserData[];
	return rdata;
}
