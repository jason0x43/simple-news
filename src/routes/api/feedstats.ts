import { getFeedStats, getUserFeeds } from '$lib/db/feed';
import { getSessionUser } from '$lib/session';
import type { RequestHandler } from '@sveltejs/kit';

export const get: RequestHandler = async ({ locals }) => {
  const user = getSessionUser(locals);

  const feeds = await getUserFeeds(user.id);
  const feedStats = await getFeedStats(feeds);

  return {
    status: 200,
    body: feedStats
  };
};
