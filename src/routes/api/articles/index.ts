import type { ArticleUpdateRequest, ArticleUpdateResponse } from '$lib/types';

export async function put(
	data: ArticleUpdateRequest
): Promise<ArticleUpdateResponse> {
	const resp = await fetch('/api/articles', {
		method: 'PUT',
		body: JSON.stringify(data)
	});
	const rdata = (await resp.json()) as ArticleUpdateResponse;
	return rdata;
}
