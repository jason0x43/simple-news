import { getFeedStats, getUserFeeds } from '$lib/db/feed';
import { unauthResponse } from '$lib/request';
import { getSessionUser } from '$lib/session';
import type { RequestHandler } from '@sveltejs/kit';

export const get: RequestHandler = async ({ locals }) => {
  const user = getSessionUser(locals);
  if (!user) {
    return unauthResponse();
  }

  const feeds = await getUserFeeds(user.id);
  const feedStats = await getFeedStats(feeds);

  return {
    status: 200,
    body: feedStats
  };
};
