import { prisma } from '$lib/db';
import {
  getArticleHeadings,
  updateArticlesUserData,
  type ArticleHeadingWithUserData,
  type ArticleUserData
} from '$lib/db/article';
import {
  getQueryParam,
  unauthResponse,
  type ErrorResponse
} from '$lib/request';
import { getSessionUser } from '$lib/session';
import type { Article, Feed } from '@prisma/client';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * Get article headings for articles from a given set of feed IDs
 */
export const get: RequestHandler<
  Record<string, string>,
  ArticleHeadingWithUserData[] | ErrorResponse
> = async function ({ url, locals }) {
  const user = getSessionUser(locals);
  if (!user) {
    return unauthResponse();
  }

  let feedIds: Feed['id'][] | undefined;

  const feedOrGroupId = getQueryParam(url.searchParams, 'feedId');
  if (feedOrGroupId) {
    const [type, id] = feedOrGroupId.split('-');
    if (type === 'group') {
      const group = await prisma.feedGroup.findUnique({
        where: {
          id
        },
        include: {
          feeds: true
        }
      });
      feedIds = group?.feeds.map(({ feedId }) => feedId) ?? [];
    } else {
      const feed = await prisma.feed.findUnique({
        where: {
          id
        }
      });
      feedIds = feed ? [feed.id] : [];
    }
  }

  const articles = await getArticleHeadings({
    userId: user.id,
    feedIds
  });

  return {
    status: 200,
    body: articles
  };
};

export type ArticleUpdateRequest = {
  articleIds: Article['id'][];
  userData: Partial<ArticleUserData>;
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
export const put: RequestHandler<
  Record<string, string>,
  ArticleUpdateResponse
> = async function ({ request, locals }) {
  const user = getSessionUser(locals);
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

  return {
    body: {
      articles: await updateArticlesUserData({
        userId: user.id,
        articleIds: data.articleIds,
        userData: data.userData
      })
    }
  };
};
