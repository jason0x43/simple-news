import { getFeedStats, type FeedStats } from '$lib/db/feed';
import { getUserFeeds } from '$lib/db/feedgroup';
import { unauthResponse, type ErrorResponse } from '$lib/request';
import { getSessionUser } from '$lib/session';
import type { RequestHandler } from './__types/feedstats';

export type GetFeedStatsResponse = FeedStats | ErrorResponse;

export const GET: RequestHandler = ({ locals }) => {
  const user = getSessionUser(locals);
  if (!user) {
    return unauthResponse();
  }

  const feeds = getUserFeeds(user.id);
  const feedStats = getFeedStats({ userId: user.id, feeds });

  return {
    status: 200,
    body: feedStats
  };
};
