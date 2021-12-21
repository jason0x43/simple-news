/// <reference lib="dom" />

import {
  DOMParser,
  Element,
  FeedEntry,
  log,
  ParsedFeed,
  parseFeed,
} from "./deps.ts";
import {
  addArticle,
  getArticles,
  getFeedByUrl,
  getFeeds,
  hasArticle,
  inTransaction,
  setArticleContent,
  setFeedIcon,
} from "./database/mod.ts";
import { escapeHtml, unescapeHtml } from "../util.ts";
import { Article } from "../types.ts";

async function getIcon(feed: ParsedFeed): Promise<string | null> {
  if (feed.icon) {
    const response = await fetch(feed.icon, { method: "HEAD" });
    if (response.status === 200) {
      log.debug(`Using feed icon ${feed.icon} for ${feed.id}`);
      return feed.icon;
    }
  }

  if (feed.links.length > 0) {
    const feedBase = new URL(feed.links[0]).origin;
    const htmlResponse = await fetch(feedBase);
    const html = await htmlResponse.text();
    const doc = new DOMParser().parseFromString(html, "text/html")!;
    const iconLink = doc.head.querySelector('link[rel*="icon"]');
    if (iconLink) {
      const iconHref = iconLink.getAttribute("href")!;
      const iconUrl = new URL(iconHref, feedBase);
      const iconResponse = await fetch(`${iconUrl}`, { method: "HEAD" });
      if (iconResponse.status === 200) {
        log.debug(`Using link ${iconUrl} for ${feed.id}`);
        return `${iconUrl}`;
      }
    }

    const favicon = new URL("/favicon.ico", feedBase);
    const response = await fetch(`${favicon}`, { method: "HEAD" });
    if (
      response.status === 200 && response.headers.get("content-length") !== "0"
    ) {
      log.debug(`Using favicon ${favicon} for ${feed.id}`);
      return `${favicon}`;
    }
  }

  return null;
}

async function downloadFeed(url: string) {
  let xml: string | undefined;

  try {
    const feed = getFeedByUrl(url);

    if (feed.disabled) {
      log.debug(`Skipping disabled feed ${feed.id}`);
      return;
    }

    const aborter = new AbortController();
    const abortTimer = setTimeout(() => aborter.abort(), 10000);
    const response = await fetch(url, { signal: aborter.signal });
    clearTimeout(abortTimer);

    if (response.status !== 200) {
      log.warning(`Error downloading feed ${feed.id}: ${response.status}`);
      return;
    }

    xml = await response.text();
    if (xml.length === 0) {
      log.warning(`Empty document for feed ${feed.id}`);
      return;
    }

    log.debug(`Downloaded feed ${feed.id}`);

    const parsedFeed = await parseFeed(xml);

    log.debug(`Parsed feed ${feed.id}`);

    if (!feed.icon) {
      const icon = await getIcon(parsedFeed);
      setFeedIcon(feed.id, icon);
      log.debug(`Set icon for ${feed.id} to ${icon}`);
    }

    const articles: Omit<Article, "id">[] = [];

    for (const entry of parsedFeed.entries) {
      if (!hasArticle(entry.id)) {
        articles.push({
          articleId: entry.id,
          feedId: feed.id,
          title: entry.title?.value ?? "Untitled",
          link: getEntryLink(entry),
          published: getEntryPublishDate(entry),
          content: await getEntryContent(entry),
        });
      }
    }

    inTransaction(() => {
      for (const article of articles) {
        addArticle(article);
      }
    });

    log.info(`Processed feed ${feed.id} (${feed.url})`);
  } catch (error) {
    log.error(`Error updating ${url}: ${error}`);
  }
}

function getEntryPublishDate(
  entry: { published?: Date | string; updated?: Date | string },
): number {
  for (const prop of ["published", "updated"] as const) {
    const val = entry[prop];
    if (val) {
      if (typeof val === "number" || val instanceof Date) {
        return Number(val);
      }
      if (typeof val === "string") {
        return Number(new Date(val));
      }
    }
  }
  return Date.now();
}

type FeedEntryEncoded = FeedEntry & {
  "content:encoded"?: FeedEntry["content"];
};

function getEntryLink(entry: FeedEntryEncoded): string | undefined {
  return entry.links[0]?.href;
}

async function getEntryContent(
  entry: FeedEntryEncoded,
): Promise<string | undefined> {
  const link = getEntryLink(entry);

  // Explosm feeds have no content and simply link to a comic -- grab the comic
  if (link && /explosm/.test(link)) {
    const response = await fetch(link);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html")!;
    const comic = doc.querySelector("#main-comic");
    const comicHtml = comic?.outerHTML;
    return comicHtml ? escapeHtml(comicHtml) : comicHtml;
  }

  let text: string | undefined;

  for (const key of ["content", "content:encoded", "description"] as const) {
    if (entry[key]?.value) {
      text = entry[key]!.value;
      break;
    }
  }

  // cleanup text
  if (text) {
    return formatArticle(text, link);
  }

  return undefined;
}

function formatArticle(text: string, baseUrl?: string): string {
  text = unescapeHtml(text);

  const doc = new DOMParser().parseFromString(text, "text/html")!;

  if (baseUrl) {
    try {
      const imgs = doc.querySelectorAll("img");
      for (const img of imgs) {
        const imgElement = img as unknown as Element;
        const src = imgElement.getAttribute("src")!;
        const newSrc = `${new URL(src, baseUrl)}`;
        imgElement.setAttribute("src", newSrc);
      }

      const anchors = doc.querySelectorAll("a");
      for (const a of anchors) {
        const aElement = a as unknown as Element;
        const href = aElement.getAttribute("href")!;
        const newSrc = `${new URL(href, baseUrl)}`;
        aElement.setAttribute("src", newSrc);
      }

      const listItems = doc.querySelectorAll("li");
      for (const item of listItems) {
        const eItem = item as unknown as HTMLElement;
        if (eItem.previousElementSibling?.tagName === "BR") {
          eItem.previousElementSibling.remove();
        }
        if (eItem.nextElementSibling?.tagName === "BR") {
          eItem.nextElementSibling.remove();
        }
      }
    } catch (error) {
      log.warning(`Error updating links in article: ${error.message}`);
    }
  }

  const quotes = doc.querySelectorAll("q");
  for (const quote of quotes) {
    quote.textContent = quote.textContent.replace(/^\s*["“]/, "").replace(
      /["”]\s*$/,
      "",
    );
  }

  return escapeHtml(doc.body.innerHTML);
}

export async function refreshFeeds(urls?: string[]) {
  const feedUrls = urls && urls.length > 0
    ? urls
    : getFeeds().map((feed) => feed.url);
  await Promise.allSettled(feedUrls.map(downloadFeed));
}

export function formatArticles() {
  const articles = getArticles();
  log.debug(`Formatting ${articles.length} articles...`);
  let count = 0;
  inTransaction(() => {
    for (const article of articles) {
      if (article.content) {
        setArticleContent(article.id, formatArticle(article.content));
      }
      count++;
      if (count % 100 === 0) {
        log.debug(`Formatted ${count} articles`);
      }
    }
  });
}
