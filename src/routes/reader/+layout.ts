import type { GetFeedGroupsResponse } from '../api/feedgroups/+server';
import type { GetFeedsResponse } from '../api/feeds/+server';
import type { GetFeedStatsResponse } from '../api/feedstats/+server';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, fetch }) => {
	const { user, articleFilter } = data;

	const feedGroupsResp = await fetch('/api/feedgroups');
	const feedGroups: GetFeedGroupsResponse = await feedGroupsResp.json();

	const feedStatsResp = await fetch('/api/feedstats');
	const feedStats: GetFeedStatsResponse = await feedStatsResp.json();

	const feedsResp = await fetch('/api/feeds');
	const feeds: GetFeedsResponse = await feedsResp.json();

	return {
		articleFilter,
		user,
		feedStats,
		feeds,
		feedGroups
	};
};
