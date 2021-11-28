import { log, parseFeed } from "../deps.ts";
import {
  addArticle,
  getFeedByUrl,
  getFeeds,
  hasArticle,
} from "./database/mod.ts";

async function downloadFeed(url: string) {
  let xml: string | undefined;

  try {
    const feed = getFeedByUrl(url);
    if (feed.disabled) {
      log.debug(`Skipping disabled feed ${url}`);
      return;
    }

    const response = await fetch(url);
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
          link: entry.links[0].href,
          published: getEntryPublishDate(entry),
          content: `${entry.content}`,
          summary: entry.description?.value,
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

export async function downloadFeeds(urls: string[]) {
  const feedUrls = urls.length > 0 ? urls : getFeeds().map((feed) => feed.url);
  await Promise.allSettled(feedUrls.map(downloadFeed));
}
