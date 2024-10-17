export const ArticleFilters = ["unread", "all"] as const;
export type ArticleFilter = (typeof ArticleFilters)[number];

export function isArticleFilter(value: string | null): value is ArticleFilter {
	return value != null && ArticleFilters.includes(value as ArticleFilter);
}
