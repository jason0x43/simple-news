//
// Download feeds
//

import * as cheerio from 'cheerio';
import Parser, { type Item } from 'rss-parser';
import { fetch } from 'undici';
import { upsertArticle } from '../src/lib/db/article.js';
import { getFeeds, updateFeedIcon } from '../src/lib/db/feed.js';
import { closeDb } from '../src/lib/db/lib/db.js';
import type { Feed } from '../src/lib/db/schema.js';
import { downloadFeed as getFeed, type FeedItem } from '../src/lib/feed.js';

// @ts-expect-error undici fetch is a valid replacement in this context
global.fetch = fetch;

type ParsedFeed = Parser.Output<unknown>;

async function downloadFeeds() {
	console.log('>>> Downloading feeds...');
	const feeds = getFeeds();
	let feed = feeds.pop();
	while (feed) {
		await downloadFeed(feed);
		console.debug(`>>> Processed feed ${feed.title} (${feeds.length} left)`);
		feed = feeds.pop();
	}
	console.log('>>> Finished downloading');
	closeDb();
}

async function downloadFeed(feed: Feed) {
	try {
		if (feed.disabled) {
			console.debug(`>>> Skipping disabled feed ${feed.id}`);
			return;
		}

		const parsedFeed = await getFeed(feed.url);

		if (!feed.icon) {
			const icon = await getIcon(parsedFeed);
			if (icon) {
				updateFeedIcon({
					feedId: feed.id,
					icon
				});
				console.log(`>>> Updated icon for ${feed.url}`);
			}
		}

		let entry = parsedFeed.items.pop();
		while (entry) {
			const articleId = getArticleId(entry);
			const content = getContent(entry);
			upsertArticle({
				articleId,
				feedId: feed.id,
				content,
				title: entry.title ?? 'Untitled',
				link: entry.link ?? null,
				published: entry.pubDate ? Number(new Date(entry.pubDate)) : Date.now()
			});
			entry = parsedFeed.items.pop();
		}
	} catch (error) {
		console.error(`>>> Error updating ${feed.url}: ${error}`);
	}
}

/**
 * Get the content of a feed item
 */
function getContent(entry: FeedItem): string {
	let content =
		entry['content:encoded'] ?? entry.content ?? entry.summary ?? null;
	if (content) {
		try {
			const $ = cheerio.load(content);
			$('a').each((_, a) => {
				$(a).removeAttr('style');
			});
			content = $('body').html();
		} catch (error) {
			console.warn('Error processing document content');
		}
	}
	return content;
}

/**
 * Return some sort of unique ID for an article
 */
function getArticleId(article: Item & { [key: string]: unknown }): string {
	if (article.guid) {
		return article.guid;
	}

	if (article.id) {
		return article.id as string;
	}

	if (article.link) {
		return article.link;
	}

	return hashString(
		article.title ?? '' + article.summary ?? '' + article.content ?? ''
	);
}

async function getIcon(feed: ParsedFeed): Promise<string | null> {
	if (feed.image) {
		const response = await fetch(feed.image.url, { method: 'HEAD' });
		await response.body?.cancel();
		if (response.status === 200) {
			console.debug(`Using feed icon ${feed.image} for ${feed.title}`);
			return feed.image.url;
		}
	}

	if (feed.link) {
		const feedBase = new URL(feed.link).origin;
		const htmlResponse = await fetch(feedBase);
		const html = await htmlResponse.text();
		const $ = cheerio.load(html);
		const iconLink = $('link[rel*="icon"]');

		if (iconLink) {
			const iconHref = iconLink.attr('href') as string;
			const iconUrl = new URL(iconHref, feedBase);

			// Try https by default
			iconUrl.protocol = 'https';
			const iconResponse = await fetch(`${iconUrl}`, { method: 'HEAD' });
			await iconResponse.body?.cancel();
			if (iconResponse.status === 200) {
				console.debug(`Using link ${iconUrl} for ${feed.title}`);
				return `${iconUrl}`;
			}

			iconUrl.protocol = 'http';
			const httpIconResponse = await fetch(`${iconUrl}`, { method: 'HEAD' });
			await httpIconResponse.body?.cancel();
			if (httpIconResponse.status === 200) {
				console.debug(`Using link ${iconUrl} for ${feed.title}`);
				return `${iconUrl}`;
			}
		}

		const favicon = new URL('/favicon.ico', feedBase);
		const response = await fetch(`${favicon}`, { method: 'HEAD' });
		await response.body?.cancel();
		if (
			response.status === 200 &&
			response.headers.get('content-length') !== '0'
		) {
			console.debug(`Using favicon ${favicon} for ${feed.title}`);
			return `${favicon}`;
		}
	}

	return null;
}

function hashString(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash &= hash;
	}
	return new Uint32Array([hash])[0].toString(36);
}

downloadFeeds();

setInterval(() => {
	downloadFeeds();
}, 600_000);
