import { getArticleHeadings } from '$lib/db/article';
import { getFeedGroupWithFeeds } from '$lib/db/feedgroup';
import type { Feed } from '$lib/db/schema';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, params }) => {
  const userId = locals.user?.id;
  if (!userId) {
    return {
      status: 302,
      redirect: '/login'
    };
  }

  const feedId = params.feedId;
  const [type, id] = feedId.split('-');
  let feedIds: Feed['id'][];

  if (type === 'group') {
    const group = getFeedGroupWithFeeds(id);
    feedIds = group.feeds.map(({ id }) => id) ?? [];
  } else {
    feedIds = [id];
  }
  const articleHeadings = getArticleHeadings({
    feedIds,
    userId
  });

  return {
    articleHeadings,
    feedId
  };
};
