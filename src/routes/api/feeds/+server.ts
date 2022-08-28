import { addOrGetFeed, getFeeds } from '$lib/db/feed';
import type { Feed } from '$lib/db/schema';
import { downloadFeed } from '$lib/feed';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export type GetFeedsResponse = Feed[];

/**
 * Get all feeds
 */
export const GET: RequestHandler = async () => {
  return json(getFeeds());
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
export const POST: RequestHandler = async ({ request }) => {
  const data: AddFeedRequest = await request.json();

  if (typeof data.url !== 'string') {
    throw error(400, 'A URL must be provided');
  }

  const parsedFeed = await downloadFeed(data.url);
  const feed = addOrGetFeed({
    url: data.url,
    title: parsedFeed.title ?? data.url
  });

  return json({ feed });
};
