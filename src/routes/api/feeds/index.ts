import { prisma } from '$lib/db';
import { downloadFeed } from '$lib/feed';
import type { Feed } from '@prisma/client';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * Get all feeds
 */
export const get: RequestHandler<Record<string, string>, Feed[]> = async () => {
  return {
    status: 200,
    body: await prisma.feed.findMany()
  };
};

export type AddFeedRequest = {
  url: string;
};

export type AddFeedResponse = {
  errors?: Record<string, string>;
  feed?: Feed;
};

/**
 * Add a new feed
 */
export const post: RequestHandler<
  Record<string, string>,
  AddFeedResponse
> = async ({ request }) => {
  const data: AddFeedRequest = await request.json();

  if (typeof data.url !== 'string') {
    return {
      status: 400,
      body: {
        errors: {
          url: 'A URL must be provided'
        }
      }
    };
  }

  const parsedFeed = await downloadFeed(data.url);
  console.log(`parsed feed for ${data.url}: ${parsedFeed.title}`);

  const feed = await prisma.feed.upsert({
    where: {
      url: data.url
    },
    update: {},
    create: {
      url: data.url,
      title: parsedFeed.title ?? data.url
    }
  });

  return {
    body: {
      feed
    }
  };
};
