import type { Article } from './db/article';
import * as cheerio from 'cheerio';

export function getArticleContent(article: Article | null): string {
	if (!article) {
		return '';
	}

	const { content } = article;
	if (!content) {
		return '';
	}

	const $ = cheerio.load(content);

	const { link } = article;
	let baseUrl: string | undefined;
	if (link) {
		const { origin } = new URL(link);
		baseUrl = origin;
	}

	$('img').each((_, img) => {
		const src = img.attribs['src'];
		if (src) {
			const url = new URL(src, baseUrl);
			img.attribs['src'] = url.href;
		}
	});

	return $.html();
}
