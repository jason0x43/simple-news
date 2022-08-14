import { getFeedStats, getUserFeeds, type FeedStats } from '$lib/db/feed';
import { unauthResponse, type ErrorResponse } from '$lib/request';
import { getSessionUser } from '$lib/session';
import type { RequestHandler } from './__types/feedstats';

export type GetFeedStatsResponse = FeedStats | ErrorResponse;

export const GET: RequestHandler = async ({ locals }) => {
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
