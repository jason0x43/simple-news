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

	const link = article.link ?? undefined;
	rebaseUrls(link, $);

	removeInternalHeading($);
	removeFonts($);
	removeHorizontalPadding($);
	removeBorderRadii($);
	removeExplicitImageSize($);
	removeBreaks($);

	return $.html();
}

function rebaseUrls(baseUrl: string | undefined, $: cheerio.CheerioAPI): void {
	if (baseUrl) {
		const { origin } = new URL(baseUrl);
		baseUrl = origin;
	}

	$('img').each((_, img) => {
		const src = img.attribs['src'];
		if (src) {
			const url = new URL(src, baseUrl);
			img.attribs['src'] = url.href;
		}
	});
}

function removeFonts($: cheerio.CheerioAPI): void {
	$('[style*="font"]').each((_, elem) => {
		elem.attribs['style'] = elem.attribs['style'].replace(/font.*?;/g, '');
	});
	$('[style*="line-height"]').each((_, elem) => {
		elem.attribs['style'] = elem.attribs['style'].replace(
			/line-height.*?;/g,
			''
		);
	});
}

function removeHorizontalPadding($: cheerio.CheerioAPI): void {
	$('[style*="padding-left"]').each((_, elem) => {
		elem.attribs['style'] = elem.attribs['style'].replace(
			/padding-left.*?;/g,
			''
		);
	});
	$('[style*="padding-right"]').each((_, elem) => {
		elem.attribs['style'] = elem.attribs['style'].replace(
			/padding-right.*?;/g,
			''
		);
	});
}

function removeInternalHeading($: cheerio.CheerioAPI): void {
	$('h1').remove();
}

function removeBorderRadii($: cheerio.CheerioAPI): void {
	$('[style*="border-radius"]').each((_, elem) => {
		elem.attribs['style'] = elem.attribs['style'].replace(
			/border-radius.*?;/g,
			''
		);
	});
}

function removeExplicitImageSize($: cheerio.CheerioAPI): void {
	$('img[width]').removeAttr('width');
	$('img[height]').removeAttr('height');
}

function removeBreaks($: cheerio.CheerioAPI): void {
	$('ul br').remove();
	$('ul + br').remove();
	$('br:has(+ h2)').remove();
	$('h2 + br').remove();
}
