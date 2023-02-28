import * as cheerio from 'cheerio';
import { createHash } from 'crypto';
import Parser, { type Item } from 'rss-parser';
import { upsertArticle } from './db/article.js';
import { getEnabledFeeds, updateFeedIcon } from './db/feed.js';
import log from './log.js';

export type ParsedFeed = Parser.Output<Record<string, unknown>>;
export type FeedItem = Parser.Item & {
	'content:encoded'?: string;
};

declare global {
	/**
	 * Use a global var to store a cleanup function so it will survive HMR
	 * restarts during dev.
	 */
	// eslint-disable-next-line no-var
	var downloadCleanup: () => void | undefined;
}

/**
 * Start a feed downloader that will periodically download the feeds
 */
export function startDownloader(time = 600_000): () => void {
	const stop = global.downloadCleanup as () => void;
	stop?.();

	const aborter = new AbortController();
	const interval = setInterval(() => {
		downloadFeeds(aborter.signal);
	}, time);

	downloadFeeds(aborter.signal);

	const cleanup = () => {
		clearInterval(interval);
		aborter.abort();
	};
	global.downloadCleanup = cleanup;

	return cleanup;
}

/**
 * Download a feed
 */
export async function downloadFeed(url: string): Promise<ParsedFeed> {
	log.debug(`Downloading ${url}`);
	const response = await fetchWithTimeout(url);

	if (response.status !== 200) {
		await response.body?.cancel();
		throw new Error(`Error downloading feed: ${response.status}`);
	}

	const xml = await response.text();
	if (xml.length === 0) {
		throw new Error(`Error downloading feed: empty body`);
	}

	const parser = new Parser();
	return parser.parseString(xml);
}

/**
 * Download all the active feeds listed in the database
 */
async function downloadFeeds(signal?: AbortSignal) {
	log.info('Downloading feeds...');
	const feeds = await getEnabledFeeds();
	for (const feed of feeds) {
		if (signal?.aborted) {
			log.warn('Aborting download');
			break;
		}

		try {
			log.debug(`Starting feed ${feed.title}`);

			const parsedFeed = await downloadFeed(feed.url);
			if (!feed.icon) {
				const icon = await getIcon(parsedFeed);
				if (icon) {
					await updateFeedIcon({
						feedId: feed.id,
						icon
					});
					log.debug(`Updated icon for ${feed.url}`);
				}
			}

			for (const entry of parsedFeed.items) {
				const articleId = getArticleId(entry);
				const content = getContent(entry);
				await upsertArticle({
					article_id: articleId,
					feed_id: feed.id,
					content,
					title: entry.title ?? 'Untitled',
					link: entry.link ?? null,
					published: BigInt(
						entry.pubDate ? Number(new Date(entry.pubDate)) : Date.now()
					)
				});
			}

			log.debug(`Processed feed ${feed.title}`);
		} catch (error) {
			log.warn(`Error downloading feed ${feed.title}: ${error}`);
		}
	}
	log.info('Finished downloading');
}

/**
 * Get the content of a feed item
 */
function getContent(entry: FeedItem): string | null {
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
			log.warn('Error processing document content');
		}
	}
	return content;
}

/**
 * Return a unique ID for an article
 *
 * This ID should be consistent between runs so we can update existing articles.
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

	const hash = createHash('sha256');
	hash.update(
		article.title ?? '' + article.summary ?? '' + article.content ?? ''
	);
	return `sha256:${hash.digest('hex')}`;
}

/**
 * Get the icon for a feed
 */
async function getIcon(feed: ParsedFeed): Promise<string | null> {
	if (feed.image) {
		const response = await fetchWithTimeout(feed.image.url, { method: 'HEAD' });
		await response.body?.cancel();
		if (response.status === 200) {
			log.debug(`Using feed icon ${feed.image} for ${feed.title}`);
			return feed.image.url;
		}
	}

	if (feed.link) {
		const feedBase = new URL(feed.link).origin;
		const htmlResponse = await fetchWithTimeout(feedBase);
		const html = await htmlResponse.text();
		const $ = cheerio.load(html);
		const iconLink = $('link[rel*="icon"]');

		if (iconLink) {
			const iconHref = iconLink.attr('href') as string;
			const iconUrl = new URL(iconHref, feedBase);

			// Try https by default
			iconUrl.protocol = 'https';
			const iconResponse = await fetchWithTimeout(`${iconUrl}`, {
				method: 'HEAD'
			});
			await iconResponse.body?.cancel();
			if (iconResponse.status === 200) {
				log.debug(`Using link ${iconUrl} for ${feed.title}`);
				return `${iconUrl}`;
			}

			iconUrl.protocol = 'http';
			const httpIconResponse = await fetchWithTimeout(`${iconUrl}`, {
				method: 'HEAD'
			});
			await httpIconResponse.body?.cancel();
			if (httpIconResponse.status === 200) {
				log.debug(`Using link ${iconUrl} for ${feed.title}`);
				return `${iconUrl}`;
			}
		}

		const favicon = new URL('/favicon.ico', feedBase);
		const response = await fetchWithTimeout(`${favicon}`, { method: 'HEAD' });
		await response.body?.cancel();
		if (
			response.status === 200 &&
			response.headers.get('content-length') !== '0'
		) {
			log.debug(`Using favicon ${favicon} for ${feed.title}`);
			return `${favicon}`;
		}
	}

	return null;
}

/**
 * Try to fetch a URL, timeout after 5 seconds
 */
async function fetchWithTimeout(
	url: string,
	init?: RequestInit
): Promise<Response> {
	return fetch(url, {
		signal: AbortSignal.timeout(5000),
		...init
	});
}
