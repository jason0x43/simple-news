import type { ArticleWithUserData } from '$lib/db/article';

export async function get(groupId: string): Promise<ArticleWithUserData[]> {
	const resp = await fetch(`/api/feedgroups/${groupId}/articles`);
	const rdata = (await resp.json()) as ArticleWithUserData[];
	return rdata;
}
