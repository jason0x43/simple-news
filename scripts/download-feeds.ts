//
// Download feeds
//

import type { Feed } from '@prisma/client';
import { prisma } from '../app/lib/db';
import Parser, { type Item } from 'rss-parser';
import { JSDOM } from 'jsdom';

type ParsedFeed = Parser.Output<unknown>;

async function downloadFeeds() {
  console.log('>>> Downloading feeds...');
  const feeds = await prisma.feed.findMany();
  await Promise.all(feeds.map(downloadFeed));
  console.log('>>> Finished downloading');
}

async function downloadFeed(feed: Feed) {
  let xml: string | undefined;

  try {
    if (feed.disabled) {
      console.debug(`>>> Skipping disabled feed ${feed.id}`);
      return;
    }

    const parser = new Parser();

    const aborter = new AbortController();
    const abortTimer = setTimeout(() => aborter.abort(), 10000);
    const response = await fetch(feed.url, { signal: aborter.signal });
    clearTimeout(abortTimer);

    if (response.status !== 200) {
      console.warn(
        `>>> Error downloading feed ${feed.title}: ${response.status}`
      );
      return;
    }

    xml = await response.text();
    if (xml.length === 0) {
      console.warn(`>>> Empty document for feed ${feed.id}`);
      return;
    }

    const parsedFeed = await parser.parseString(xml);

    if (!feed.icon) {
      const icon = await getIcon(parsedFeed);
      await prisma.feed.update({
        where: {
          id: feed.id,
        },
        data: {
          icon,
        },
      });
    }

    await prisma.$transaction(
      parsedFeed.items.map((entry) => {
        const articleId = getArticleId(entry);
        return prisma.article.upsert({
          where: {
            feedId_articleId: {
              articleId,
              feedId: feed.id,
            },
          },
          update: {},
          create: {
            articleId,
            feedId: feed.id,
            title: entry.title ?? 'Untitled',
            link: entry.link ?? null,
            published: Number(
              entry.pubDate ? new Date(entry.pubDate) : new Date()
            ),
            content: entry['content:encoded'] ?? entry.content ?? null,
          },
        });
      })
    );

    console.debug(`>>> Processed feed ${feed.title}`);
  } catch (error) {
    console.error(`>>> Error updating ${feed.url}: ${error}`);
  }
}

/**
 * Return some sort of unique ID for an article
 */
function getArticleId(article: Item & { [key: string]: any }): string {
  if (article.guid) {
    return article.guid;
  }

  if (article.id) {
    return article.id;
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
    if (response.status === 200) {
      console.debug(`Using feed icon ${feed.image} for ${feed.title}`);
      return feed.image.url;
    }
  }

  if (feed.link) {
    const feedBase = new URL(feed.link).origin;
    const htmlResponse = await fetch(feedBase);
    const html = await htmlResponse.text();
    const dom = new JSDOM(html);
    const iconLink =
      dom.window.document.head.querySelector('link[rel*="icon"]');

    if (iconLink) {
      const iconHref = iconLink.getAttribute('href')!;
      const iconUrl = new URL(iconHref, feedBase);

      // Try https by default
      iconUrl.protocol = 'https';
      const iconResponse = await fetch(`${iconUrl}`, { method: 'HEAD' });
      if (iconResponse.status === 200) {
        console.debug(`Using link ${iconUrl} for ${feed.title}`);
        return `${iconUrl}`;
      }

      iconUrl.protocol = 'http';
      const httpIconResponse = await fetch(`${iconUrl}`, { method: 'HEAD' });
      if (httpIconResponse.status === 200) {
        console.debug(`Using link ${iconUrl} for ${feed.title}`);
        return `${iconUrl}`;
      }
    }

    const favicon = new URL('/favicon.ico', feedBase);
    const response = await fetch(`${favicon}`, { method: 'HEAD' });
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