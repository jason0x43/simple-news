import type { LoadEvent, RequestHandlerOutput } from '@sveltejs/kit';
import type { GetFeedGroupsResponse } from 'src/routes/api/feedgroups';
import type { GetFeedsResponse } from 'src/routes/api/feeds';
import type { GetFeedStatsResponse } from 'src/routes/api/feedstats';
import type { FeedStats } from '$lib/db/feed';
import type { FeedGroupWithFeeds } from '$lib/db/feedgroup';
import {
  type ErrorResponse,
  errorResponse,
  isErrorResponse
} from '$lib/request';
import type { Feed } from '$lib/db/schema';

async function loadFeedStats(fetch: LoadEvent['fetch']) {
  const feedStatsResp = await fetch('/api/feedstats');
  return (await feedStatsResp.json()) as GetFeedStatsResponse;
}

async function loadFeedGroups(fetch: LoadEvent['fetch']) {
  const feedGroupsResp = await fetch('/api/feedgroups');
  return (await feedGroupsResp.json()) as GetFeedGroupsResponse;
}

async function loadFeeds(fetch: LoadEvent['fetch']) {
  const feedsResp = await fetch('/api/feeds');
  return (await feedsResp.json()) as GetFeedsResponse;
}

export async function loadData(fetch: LoadEvent['fetch']): Promise<
  | {
      feedStats: FeedStats;
      feeds: Feed[];
      feedGroups: FeedGroupWithFeeds[];
    }
  | RequestHandlerOutput<ErrorResponse>
> {
  const [feedStats, feedGroups, feeds] = await Promise.all([
    loadFeedStats(fetch),
    loadFeedGroups(fetch),
    loadFeeds(fetch)
  ]);

  if (isErrorResponse(feedStats)) {
    return errorResponse(feedStats.errors);
  }

  if (isErrorResponse(feedGroups)) {
    return errorResponse(feedGroups.errors);
  }

  if (isErrorResponse(feeds)) {
    return errorResponse(feeds.errors);
  }

  return { feedStats, feedGroups, feeds };
}
