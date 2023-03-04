import type { Article } from './db/article';

export function getArticleContent(article: Article | null): string {
	if (!article) {
		return '';
	}

	const { content } = article;
	if (!content) {
		return '';
	}

	const div = document.createElement('div');
	div.innerHTML = content;

	const { link } = article;
	let baseUrl: string | undefined;
	if (link) {
		const { origin } = new URL(link);
		baseUrl = origin;
	}

	for (const img of div.querySelectorAll('img')) {
		const src = img.getAttribute('src');
		if (!src) {
			continue;
		}
		const url = new URL(src, baseUrl);
		img.setAttribute('src', url.href);
	}

	return div.innerHTML;
}
