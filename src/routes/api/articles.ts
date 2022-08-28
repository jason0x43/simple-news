import {
  getArticleHeadings,
  markArticlesRead,
  type ArticleHeadingWithUserData
} from '$lib/db/article';
import { getFeed } from '$lib/db/feed';
import { getFeedGroupWithFeeds } from '$lib/db/feedgroup';
import type { Article, Feed } from '$lib/db/schema';
import { unauthResponse } from '$lib/request';
import type { RequestHandler } from './__types/articles';

/**
 * Get article headings for articles from a given set of feed IDs
 */
export const GET: RequestHandler = async function ({ url, locals }) {
  const user = locals.session?.user;
  if (!user) {
    return unauthResponse();
  }

  let feedIds: Feed['id'][] | undefined;

  const feedOrGroupId = url.searchParams.get('feedId');
  if (feedOrGroupId) {
    const [type, id] = feedOrGroupId.split('-');
    if (type === 'group') {
      const group = getFeedGroupWithFeeds(id);
      feedIds = group?.feeds.map(({ id }) => id) ?? [];
    } else {
      const feed = getFeed(id);
      feedIds = feed ? [feed.id] : [];
    }
  }

  const { articleFilter } = locals.sessionData;
  const articles = await getArticleHeadings({
    userId: user.id,
    feedIds,
    filter: articleFilter
  });

  return {
    status: 200,
    body: articles
  };
};

export type ArticleUpdateRequest = {
  articleIds: Article['id'][];
  userData: {
    read?: boolean;
    saved?: boolean;
  };
};

export type ArticleUpdateResponse = {
  errors?: {
    articleIds?: string;
    userData?: string;
  };
  articles?: ArticleHeadingWithUserData[];
};

/**
 * Update user data for a set of articles
 */
export const PUT: RequestHandler = async function ({ request, locals }) {
  const user = locals.session?.user;
  if (!user) {
    return unauthResponse();
  }

  const data: ArticleUpdateRequest = await request.json();

  if (!Array.isArray(data.articleIds)) {
    return {
      status: 400,
      body: {
        errors: {
          articleIds: 'articleIds must be an array of IDs'
        }
      }
    };
  }

  if (!data.userData) {
    return {
      status: 400,
      body: {
        errors: {
          userData: 'UserData must be an object of flags'
        }
      }
    };
  }

  if (data.userData.read !== undefined) {
    markArticlesRead({
      userId: user.id,
      articleIds: data.articleIds,
      read: data.userData.read
    });
  }

  return {};
};
