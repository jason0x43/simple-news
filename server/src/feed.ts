import { XMLParser } from "fast-xml-parser";
import { isValidUrl, quickFetch } from "./util.js";
import { NewArticle } from "./schemas/public/Article.js";
import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import { z } from "zod";

type DownloadedArticle = Omit<NewArticle, "id" | "feed_id">;

type DownloadedFeed = {
	title: string;
	link: string;
	icon: string | undefined;
	articles: DownloadedArticle[];
};

type ParsedFeedItem = {
	id: string;
	title: string;
	link: string;
	updated: string;
	content: string;
};

type ParsedFeed = {
	title: string;
	link: string;
	icon: string | undefined;
	items: ParsedFeedItem[];
};

/** RSS 2.0 doc */
const RssDoc = z.object({
	rss: z.object({
		channel: z.object({
			title: z.string(),
			link: z.string(),
			description: z.string(),
			pubDate: z.optional(z.string()),
			lastBuildDate: z.optional(z.string()),
			image: z.optional(
				z.object({
					url: z.string(),
					title: z.string(),
					link: z.string(),
					width: z.optional(z.number()),
					height: z.optional(z.number()),
					description: z.optional(z.string()),
				}),
			),
			item: z.array(
				z.object({
					title: z.optional(z.string()),
					description: z.optional(z.string()),
					link: z.optional(z.string()),
					guid: z.optional(
						z.union([
							z.string(),
							z.object({
								"@_isPermaLink": z.string(),
								"#text": z.string(),
							}),
						]),
					),
					pubDate: z.optional(z.string()),
				}),
			),
		}),
	}),
});
type RssDoc = z.infer<typeof RssDoc>;

const AtomLink = z.object({
	"@_href": z.string(),
	"@_rel": z.optional(z.string()),
	"@_type": z.optional(z.string()),
	"@_title": z.optional(z.string()),
});

/** Atom 1.0 doc */
const AtomDoc = z.object({
	feed: z.object({
		title: z.string(),
		link: z.array(AtomLink),
		subtitle: z.string(),
		updated: z.string(),
		icon: z.optional(z.string()),
		author: z.object({
			name: z.string(),
			email: z.string(),
		}),
		id: z.string(),
		entry: z.array(
			z.object({
				id: z.string(),
				title: z.string(),
				updated: z.string(),
				link: AtomLink,
				content: z.object({
					"#text": z.string(),
					"@_type": z.optional(z.string()),
				}),
			}),
		),
	}),
});
type AtomDoc = z.infer<typeof AtomDoc>;

const FeedDoc = z.union([RssDoc, AtomDoc]);
type FeedDoc = z.infer<typeof FeedDoc>;

/**
 * Download and parse a feed
 */
export async function downloadFeed(feedUrl: string): Promise<DownloadedFeed> {
	console.debug(`Downloading feed ${feedUrl}...`);

	try {
		const response = await quickFetch(feedUrl);
		const xml = await response.text();
		if (xml.length === 0) {
			throw new Error(`Error downloading feed: empty body`);
		}

		const parsedFeed = parseFeed(xml);

		let icon: string | undefined = undefined;

		try {
			icon = await getIcon(parsedFeed);
		} catch (error) {
			console.warn(`Error getting icon for ${feedUrl}: ${error}`);
		}

		const articles: DownloadedArticle[] = [];

		for (const item of parsedFeed.items) {
			const content = getContent(item);
			articles.push({
				article_id: item.id,
				content,
				title: item.title,
				link: item.link,
				published: new Date(item.updated),
			});
		}

		console.debug(`Processed feed ${feedUrl}`);

		return {
			title: parsedFeed.title,
			link: parsedFeed.link,
			icon,
			articles,
		};
	} catch (error) {
		console.warn(`error downloading feed ${feedUrl}: ${error}`);
		throw new Error(`unable to download feed: ${error}`);
	}
}

function isAtomDoc(doc: FeedDoc): doc is AtomDoc {
	return "feed" in doc;
}

/**
 * Parse an XML feed document
 */
function parseFeed(xml: string): ParsedFeed {
	const parser = new XMLParser({ ignoreAttributes: false });
	const xmlDoc = parser.parse(xml);
	const feedDoc = FeedDoc.parse(xmlDoc);

	const parsedFeed: ParsedFeed = {
		title: "",
		link: "",
		icon: undefined,
		items: [],
	};

	if (isAtomDoc(feedDoc)) {
		parsedFeed.title = feedDoc.feed.title;
		parsedFeed.link = feedDoc.feed.link[0]["@_href"];
		parsedFeed.icon = feedDoc.feed.icon;
		parsedFeed.items = feedDoc.feed.entry.map((entry) => ({
			id: entry.id,
			title: entry.title,
			link: entry.link["@_href"],
			updated: entry.updated,
			content: entry.content["#text"],
		}));
	} else {
		parsedFeed.title = feedDoc.rss.channel.title;
		parsedFeed.link = feedDoc.rss.channel.link;
		parsedFeed.icon = feedDoc.rss.channel.image?.url;
		parsedFeed.items = feedDoc.rss.channel.item.map((item) => ({
			id:
				(typeof item.guid === "string"
					? item.guid
					: item.guid != null
						? item.guid["#text"]
						: undefined) ??
				item.link ??
				hashStrings(item.title ?? "", item.description ?? ""),
			title: item.title ?? "",
			link: item.link ?? "",
			updated: item.pubDate ? new Date(item.pubDate).toISOString() : "",
			content: item.description ?? "",
		}));
	}

	return parsedFeed;
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
	if (feed.icon && isValidUrl(feed.icon)) {
		console.debug(`Trying feed image URL ${feed.icon} for icon`);
		const response = await quickFetch(feed.icon, { method: "HEAD" });
		await response.body?.cancel();
		if (response.status === 200) {
			console.debug(`Using feed icon ${feed.icon} for ${feed.title} icon URL`);
			return feed.icon;
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
function getContent(entry: ParsedFeedItem): string {
	let content = entry.content;

	if (content) {
		try {
			const $ = cheerio.load(content);
			$("a").each((_, a) => {
				$(a).removeAttr("style");
			});
			content = $("body").html() ?? "";
		} catch (error) {
			console.warn("Error processing document content");
		}
	}

	return content;
}

/**
 * Generate a hash of a list of strings
 */
function hashStrings(...strings: string[]): string {
	const hash = createHash("sha256");
	hash.update(strings.join(""));
	return `sha256:${hash.digest("hex")}`;
}
