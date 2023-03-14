import * as cheerio from 'cheerio';
import hljs from 'highlight.js/lib/core';
import hlBash from 'highlight.js/lib/languages/bash';
import hlCss from 'highlight.js/lib/languages/css';
import hlGo from 'highlight.js/lib/languages/go';
import hlJavascript from 'highlight.js/lib/languages/javascript';
import hlJson from 'highlight.js/lib/languages/json';
import hlRust from 'highlight.js/lib/languages/rust';
import hlTypescript from 'highlight.js/lib/languages/typescript';
import hlXml from 'highlight.js/lib/languages/xml';
import type { Article } from './db/article';

hljs.registerLanguage('bash', hlBash);
hljs.registerLanguage('css', hlCss);
hljs.registerLanguage('go', hlGo);
hljs.registerLanguage('html', hlXml);
hljs.registerLanguage('javascript', hlJavascript);
hljs.registerLanguage('json', hlJson);
hljs.registerLanguage('rust', hlRust);
hljs.registerLanguage('typescript', hlTypescript);

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
	removeInlineCodeStyles($);
	removeBreaks($);
	highlightCode($);

	return $.html();
}

function highlightCode($: cheerio.CheerioAPI): void {
	$('pre code span').replaceWith((_, elem) => {
		return $(elem).text();
	});

	$('pre code').replaceWith((_, elem) => {
		const html = $(elem).html();
		if (html) {
			const unescaped = html
				.replace(/&gt;/g, '>')
				.replace(/&lt;/g, '<')
				.replace(/&amp;/g, '&');
			const hled = hljs.highlightAuto(unescaped).value;
			return hled;
		}
		return elem;
	});
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

function removeInlineCodeStyles($: cheerio.CheerioAPI): void {
	$('pre[style]').removeAttr('style');
}
