import { getFeedStats } from '$lib/db/feed';
import { getUserFeedGroupsWithFeeds, getUserFeeds } from '$lib/db/feedgroup';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const { user, sessionData } = locals;
  if (!user) {
    throw redirect(302, '/login');
  }

  const feeds = getUserFeeds(user.id);
  const feedStats = getFeedStats({ userId: user.id, feeds });
  const feedGroups = getUserFeedGroupsWithFeeds(user.id);

  return {
    feedStats,
    feeds,
    feedGroups,
    user,
    articleFilter: sessionData.articleFilter
  };
};
