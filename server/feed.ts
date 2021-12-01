import { DOMParser, Element, FeedEntry, log, parseFeed } from "./deps.ts";
import {
  addArticle,
  getArticles,
  getFeedByUrl,
  getFeeds,
  hasArticle,
  setArticleContent,
} from "./database/mod.ts";

async function downloadFeed(url: string) {
  let xml: string | undefined;

  try {
    const feed = getFeedByUrl(url);
    if (feed.disabled) {
      log.debug(`Skipping disabled feed ${url}`);
      return;
    }

    const aborter = new AbortController();
    const abortTimer = setTimeout(() => aborter.abort(), 10000);
    const response = await fetch(url, { signal: aborter.signal });
    clearTimeout(abortTimer);

    if (response.status !== 200) {
      log.warning(`Error downloading feed for ${url}: ${response.status}`);
      return;
    }

    xml = await response.text();
    if (xml.length === 0) {
      log.warning(`Empty document for ${url}`);
      return;
    }

    log.info(`Downloaded feed for ${url}`);

    const { entries } = await parseFeed(xml);

    log.info("Parsed entries");

    for (const entry of entries) {
      if (!hasArticle(entry.id)) {
        addArticle({
          articleId: entry.id,
          feedId: feed.id,
          title: entry.title?.value ?? "Untitled",
          link: entry.links[0]?.href,
          published: getEntryPublishDate(entry),
          content: getEntryContent(entry),
        });
      }
    }

    log.info("Added articles");
  } catch (error) {
    log.error(`Error updating ${url}: ${error}`);
  }
}

function getEntryPublishDate(
  entry: { published?: Date | string; updated?: Date | string },
): number | undefined {
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
  return undefined;
}

type FeedEntryEncoded = FeedEntry & {
  "content:encoded"?: FeedEntry["content"];
};

function getEntryContent(entry: FeedEntryEncoded): string | undefined {
  let text: string | undefined;

  for (const key of ["content", "content:encoded", "description"] as const) {
    if (entry[key]?.value) {
      text = entry[key]!.value;
      break;
    }
  }

  const link = entry.links?.[0]?.href;

  // cleanup text
  if (text) {
    return formatArticle(text, link);
  }

  return undefined;
}

function formatArticle(text: string, baseUrl?: string): string {
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&amp;/g, "&");

  const doc = new DOMParser().parseFromString(text, "text/html")!;

  if (baseUrl) {
    try {
      const imgs = doc.querySelectorAll("img");
      imgs.forEach((img) => {
        const imgElement = img as unknown as Element;
        const src = imgElement.getAttribute("src")!;
        const newSrc = `${new URL(src, baseUrl)}`;
        imgElement.setAttribute("src", newSrc);
      });

      const anchors = doc.querySelectorAll("a");
      anchors.forEach((a) => {
        const aElement = a as unknown as Element;
        const href = aElement.getAttribute("href")!;
        const newSrc = `${new URL(href, baseUrl)}`;
        aElement.setAttribute("src", newSrc);
      });
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

  return doc.body.innerHTML;
}

export async function downloadFeeds(urls: string[]) {
  const feedUrls = urls.length > 0 ? urls : getFeeds().map((feed) => feed.url);
  await Promise.allSettled(feedUrls.map(downloadFeed));
}

export function formatArticles() {
  const articles = getArticles();
  log.debug(`Formatting ${articles.length} articles...`);
  for (const article of articles) {
    if (article.content) {
      setArticleContent(article.id, formatArticle(article.content));
      log.debug(`Formatted ${article.id}`);
    }
  }
}
