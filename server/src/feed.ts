import Parser, { Item } from "rss-parser";
import { Feed } from "./schemas/public/Feed.js";
import { isValidUrl, quickFetch } from "./util.js";
import { NewArticle } from "./schemas/public/Article.js";
import { createHash } from "node:crypto";
import * as cheerio from "cheerio";

type ParsedFeed = Parser.Output<Record<string, unknown>>;

type FeedItem = Parser.Item & {
	"content:encoded"?: string;
};

type DownloadedArticle = Omit<NewArticle, "id">;

type DownloadedFeed = {
	icon: string | undefined;
	articles: DownloadedArticle[];
};

export async function downloadFeed(feed: Feed): Promise<DownloadedFeed> {
	try {
		console.debug(`Refreshing feed ${feed.title}`);

		const response = await quickFetch(feed.url);
		const xml = await response.text();
		if (xml.length === 0) {
			throw new Error(`Error downloading feed: empty body`);
		}

		// TODO: consider switching to fast-xml-parser instead of rss-parser

		const parser = new Parser();
		const parsedFeed = await parser.parseString(xml);

		let icon: string | undefined = undefined;

		try {
			icon = await getIcon(parsedFeed);
		} catch (error) {
			console.warn(`Error getting icon for ${feed.title}: ${error}`);
		}

		const articles: DownloadedArticle[] = [];

		for (const entry of parsedFeed.items) {
			const articleId = getArticleId(entry);
			const content = getContent(entry);
			articles.push({
				article_id: articleId,
				feed_id: feed.id,
				content,
				title: entry.title ?? "Untitled",
				link: entry.link ?? null,
				// TODO: use entry updated date if pubDate isn't there
				published: entry.pubDate ? new Date(entry.pubDate) : new Date(),
			});
		}

		console.debug(`Processed feed ${feed.title}`);

		return { icon, articles };
	} catch (error) {
		console.warn(`error downloading feed ${feed.title}: ${error}`);
		throw new Error(`unable to download feed: ${error}`);
	}
}

/**
 * Get the icon for a feed as a data URL
 */
async function getIcon(feed: ParsedFeed): Promise<string | undefined> {
	const url = await getIconUrl(feed);

	if (url) {
		console.debug(`Getting icon data for ${url}`);

		try {
			const resp = await fetch(url);
			const buf = Buffer.from(await resp.arrayBuffer());
			const type = resp.headers.get("content-type");
			return `data:${type};base64,${buf.toString("base64")}`;
		} catch (error) {
			console.warn(`Error downloading icon: ${error}`);
		}
	}
}

/**
 * Get the icon URL for a feed
 */
async function getIconUrl(feed: ParsedFeed): Promise<string | undefined> {
	if (feed.image && isValidUrl(feed.image.url)) {
		console.debug(`Trying feed image URL ${feed.image.url} for icon`);
		const response = await quickFetch(feed.image.url, { method: "HEAD" });
		await response.body?.cancel();
		if (response.status === 200) {
			console.debug(
				`Using feed icon ${feed.image.url} for ${feed.title} icon URL`,
			);
			return feed.image.url;
		}
	}

	if (feed.link && isValidUrl(feed.link)) {
		console.debug(
			`Looking in content of ${feed.link} (${typeof feed.link}) for icon`,
		);
		const feedBase = new URL(feed.link).origin;
		const htmlResponse = await quickFetch(feedBase);
		const html = await htmlResponse.text();
		const $ = cheerio.load(html);
		const iconLink = $('link[rel*="icon"]');

		if (iconLink.length > 0) {
			console.debug(`Trying iconLink ${iconLink}`);
			const iconHref = iconLink.attr("href") as string;
			const iconUrl = new URL(iconHref, feedBase);

			console.debug(`Made iconUrl ${iconUrl}`);

			// Try https by default
			iconUrl.protocol = "https";
			const iconResponse = await quickFetch(`${iconUrl}`, {
				method: "HEAD",
			});
			await iconResponse.body?.cancel();
			if (iconResponse.status === 200) {
				console.debug(`Using link ${iconUrl} for ${feed.title} icon URL`);
				return `${iconUrl}`;
			}

			iconUrl.protocol = "http";
			const httpIconResponse = await quickFetch(`${iconUrl}`, {
				method: "HEAD",
			});
			await httpIconResponse.body?.cancel();
			if (httpIconResponse.status === 200) {
				console.debug(`Using link ${iconUrl} for ${feed.title} icon URL`);
				return `${iconUrl}`;
			}
		}

		const favicon = new URL("/favicon.ico", feedBase);
		const response = await quickFetch(`${favicon}`, { method: "HEAD" });
		await response.body?.cancel();
		if (
			response.status === 200 &&
			response.headers.get("content-length") !== "0"
		) {
			console.debug(`Using favicon ${favicon} for ${feed.title} icon URL`);
			return `${favicon}`;
		}
	}
}

/**
 * Get the content of a feed item
 */
function getContent(entry: FeedItem): string {
	let content = entry["content:encoded"] ?? entry.content ?? entry.summary;
	if (content) {
		try {
			const $ = cheerio.load(content);
			$("a").each((_, a) => {
				$(a).removeAttr("style");
			});
			content = $("body").html() ?? undefined;
		} catch (error) {
			console.warn("Error processing document content");
		}
	}

	return content ?? "";
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

	const hash = createHash("sha256");
	hash.update(
		article.title ?? "" + article.summary ?? "" + article.content ?? "",
	);

	return `sha256:${hash.digest("hex")}`;
}
