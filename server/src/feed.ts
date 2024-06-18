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

const TextNode = z.object({ $text: z.string() });
const NumberNode = z.object({ $text: z.number() });

const RssChannel = z.object({
	title: TextNode,
	link: TextNode,
	description: TextNode,
	pubDate: z.optional(TextNode),
	lastBuildDate: z.optional(TextNode),
	image: z.optional(
		z.object({
			url: TextNode,
			title: TextNode,
			link: TextNode,
			width: z.optional(NumberNode),
			height: z.optional(NumberNode),
			description: z.optional(TextNode),
		}),
	),
	item: z.array(
		z.object({
			title: z.optional(TextNode),
			description: z.optional(TextNode),
			link: z.optional(TextNode),
			guid: z.optional(
				TextNode.extend({
					$$isPermaLink: z.optional(z.string()),
				}),
			),
			pubDate: z.optional(TextNode),
		}),
	),
});
type RssChannel = z.infer<typeof RssChannel>;

/** RSS 2.0 doc */
const RssDoc = z.union([
	z.object({
		rss: z.object({
			channel: RssChannel,
		}),
	}),
	// some doc's skip the rss node
	z.object({
		channel: RssChannel,
	}),
]);
type RssDoc = z.infer<typeof RssDoc>;

const AtomLink = z.object({
	$$href: z.string(),
	$$rel: z.optional(z.string()),
	$$type: z.optional(z.string()),
	$$title: z.optional(z.string()),
});

/** Atom 1.0 doc */
const AtomDoc = z.object({
	feed: z.object({
		title: TextNode,
		link: z.union([z.array(AtomLink), AtomLink]),
		subtitle: TextNode,
		updated: TextNode,
		icon: z.optional(TextNode),
		author: z.object({
			name: TextNode,
			email: TextNode,
		}),
		id: TextNode,
		entry: z.array(
			z.object({
				id: TextNode,
				title: TextNode,
				updated: TextNode,
				link: z.union([z.array(AtomLink), AtomLink]),
				content: TextNode.extend({
					$$type: z.optional(z.string()),
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

function getRssChannel(doc: RssDoc): RssChannel {
	return "rss" in doc ? doc.rss.channel : doc.channel;
}

/**
 * Parse an XML feed document
 */
function parseFeed(xml: string): ParsedFeed {
	const parser = new XMLParser({
		ignoreAttributes: false,
		alwaysCreateTextNode: true,
		textNodeName: "$text",
		attributeNamePrefix: "$$",
	});
	const xmlDoc = parser.parse(xml);
	const feedDoc = FeedDoc.parse(xmlDoc);

	const parsedFeed: ParsedFeed = {
		title: "",
		link: "",
		icon: undefined,
		items: [],
	};

	if (isAtomDoc(feedDoc)) {
		parsedFeed.title = feedDoc.feed.title.$text;
		if (Array.isArray(feedDoc.feed.link)) {
			parsedFeed.link = feedDoc.feed.link[0].$$href;
		} else {
			parsedFeed.link = feedDoc.feed.link.$$href;
		}
		parsedFeed.icon = feedDoc.feed.icon?.$text;
		parsedFeed.items = feedDoc.feed.entry.map((entry) => ({
			id: entry.id.$text,
			title: entry.title.$text,
			link: Array.isArray(entry.link) ? entry.link[0].$$href : entry.link.$$href,
			updated: entry.updated.$text,
			content: entry.content.$text,
		}));
	} else {
		const channel = getRssChannel(feedDoc);
		parsedFeed.title = channel.title.$text;
		parsedFeed.link = channel.link.$text;
		parsedFeed.icon = channel.image?.url.$text;
		parsedFeed.items = channel.item.map((item) => ({
			id:
				item.guid?.$text ??
				item.link?.$text ??
				hashStrings(item.title?.$text ?? "", item.description?.$text ?? ""),
			title: item.title?.$text ?? "",
			link: item.link?.$text ?? "",
			updated: item.pubDate ? new Date(item.pubDate.$text).toISOString() : "",
			content: item.description?.$text ?? "",
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
