import * as cheerio from 'cheerio';
import { createHash } from 'crypto';
import Parser, { type Item } from 'rss-parser';
import { upsertArticle } from './db/article.js';
import { getSubscribedFeeds, updateFeedIcon } from './db/feed.js';
import { createLog } from './log.js';
import { isValidUrl } from './util.js';

const log = createLog('info');

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
	var stopDownloader: () => void | undefined;
}

/**
 * Start a feed downloader that will periodically download the feeds
 */
export function startDownloader(time = 600_000): () => void {
	const stop = global.stopDownloader as () => void;
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
	global.stopDownloader = cleanup;

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
	const feeds = await getSubscribedFeeds();
	for (const feed of feeds) {
		if (signal?.aborted) {
			log.warn('Aborting download');
			break;
		}

		try {
			log.debug(`Starting feed ${feed.title}`);

			const parsedFeed = await downloadFeed(feed.url);
			let icon: string | null;

			try {
				icon = await getIcon(parsedFeed);
				if (icon) {
					await updateFeedIcon({
						feedId: feed.id,
						icon
					});
					log.debug(`Updated icon for ${feed.title}`);
				}
			} catch (error) {
				log.warn(`Error getting icon for ${feed.title}: ${error}`);
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
 * Get the icon for a feed as a data URL
 */
async function getIcon(feed: ParsedFeed): Promise<string | null> {
	const url = await getIconUrl(feed);

	if (url) {
		log.debug(`Getting icon data for ${url}`);

		try {
			const resp = await fetch(url);
			const buf = Buffer.from(await resp.arrayBuffer());
			const type = resp.headers.get('content-type');
			return `data:${type};base64,${buf.toString('base64')}`;
		} catch (error) {
			log.warn(`Error downloading icon: ${error}`);
		}
	}

	return url;
}

/**
 * Get the icon URL for a feed
 */
async function getIconUrl(feed: ParsedFeed): Promise<string | null> {
	if (feed.image && isValidUrl(feed.image.url)) {
		log.debug(`Trying feed image URL ${feed.image.url} for icon`);
		const response = await fetchWithTimeout(feed.image.url, { method: 'HEAD' });
		await response.body?.cancel();
		if (response.status === 200) {
			log.debug(`Using feed icon ${feed.image.url} for ${feed.title} icon URL`);
			return feed.image.url;
		}
	}

	if (feed.link && isValidUrl(feed.link)) {
		log.debug(
			`Looking in content of ${feed.link} (${typeof feed.link}) for icon`
		);
		const feedBase = new URL(feed.link).origin;
		const htmlResponse = await fetchWithTimeout(feedBase);
		const html = await htmlResponse.text();
		const $ = cheerio.load(html);
		const iconLink = $('link[rel*="icon"]');

		if (iconLink.length > 0) {
			log.debug(`Trying iconLink ${iconLink}`);
			const iconHref = iconLink.attr('href') as string;
			const iconUrl = new URL(iconHref, feedBase);

			log.debug(`Made iconUrl ${iconUrl}`);

			// Try https by default
			iconUrl.protocol = 'https';
			const iconResponse = await fetchWithTimeout(`${iconUrl}`, {
				method: 'HEAD'
			});
			await iconResponse.body?.cancel();
			if (iconResponse.status === 200) {
				log.debug(`Using link ${iconUrl} for ${feed.title} icon URL`);
				return `${iconUrl}`;
			}

			iconUrl.protocol = 'http';
			const httpIconResponse = await fetchWithTimeout(`${iconUrl}`, {
				method: 'HEAD'
			});
			await httpIconResponse.body?.cancel();
			if (httpIconResponse.status === 200) {
				log.debug(`Using link ${iconUrl} for ${feed.title} icon URL`);
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
			log.debug(`Using favicon ${favicon} for ${feed.title} icon URL`);
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
	const aborter = new AbortController();
	setTimeout(() => {
		aborter.abort(new Error(`Request for ${url} timed out`));
	}, 5000);
	return fetch(url, {
		signal: aborter.signal,
		...init
	});
}
