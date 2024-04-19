import { invalidate } from '$app/navigation';

export type MarkArticlesRequest = {
	article_ids: string[];
	mark: { read?: boolean; saved?: boolean };
};

export async function markArticles(data: MarkArticlesRequest): Promise<void> {
	const resp = await fetch('/api/mark', {
		method: 'POST',
		body: JSON.stringify(data)
	});

	if (!resp.ok) {
		throw new Error('Failed to mark articles');
	}

	await invalidate('app:articles');
}
