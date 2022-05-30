import type { Feed } from '@prisma/client';
import { json, type LoaderFunction } from '@remix-run/node';
import { Outlet, useFetcher, useLoaderData } from '@remix-run/react';
import { useCallback, useEffect, useState } from 'react';
import ArticlesList from '~/components/ArticlesList';
import { useSelectedArticle } from '~/lib/util';
import {
  getUserArticleHeadings,
  type ArticleHeadingWithUserData,
  type ArticleUserData,
} from '~/models/article.server';
import { getFeed } from '~/models/feed.server';
import { getUserFeedGroupById } from '~/models/feedGroup.server';
import type { ActionData as ArticlesActionData } from '~/routes/article';
import type { ActionData as ArticleActionData } from '~/routes/article/$id';
import { getUser } from '~/session.server';

export type LoaderData = {
  articles: ArticleHeadingWithUserData[] | null;
  feedIds: Feed['id'][];
  feedOrGroupId: Feed['id'];
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const feedOrGroupId = params.feedId as string;
  const [type, id] = feedOrGroupId.split('-');
  const user = await getUser(request);
  let feedIds: Feed['id'][];

  if (type === 'group') {
    const group = await getUserFeedGroupById(id);
    feedIds = group?.feeds.map(({ feed: { id } }) => id) ?? [];
  } else {
    const feed = await getFeed(id);
    feedIds = feed ? [feed.id] : [];
  }

  const articleHeadings = await getUserArticleHeadings({
    userId: user.id,
    feedIds,
  });

  return json<LoaderData>({
    articles: articleHeadings,
    feedOrGroupId,
    feedIds,
  });
};

type UpdatedUserData = ArticleUserData & { updated?: true };

export type UpdatedArticle = ArticleHeadingWithUserData & {
  userData?: UpdatedUserData;
};

export default function FeedRoute() {
  const data = useLoaderData<LoaderData>();
  const selectedArticle = useSelectedArticle();
  const articleUpdate = useFetcher<ArticleActionData>();
  const articlesUpdate = useFetcher<ArticlesActionData>();
  const [updatedArticles, setUpdatedArticles] = useState<
    Record<string, boolean>
  >({});
  const submitArticleUpdate = articleUpdate.submit;

  useEffect(() => {
    setUpdatedArticles({});
  }, [data.feedOrGroupId]);

  useEffect(() => {
    if (selectedArticle?.id) {
      setUpdatedArticles((updated) => ({
        ...updated,
        [selectedArticle.id]: true,
      }));
      submitArticleUpdate(
        {
          userData: JSON.stringify({ read: true }),
        },
        {
          method: 'put',
          action: `/article/${selectedArticle.id}`,
        }
      );
    }
  }, [selectedArticle?.id, submitArticleUpdate]);

  const handleMarkAsRead = useCallback(
    (articleIds: string[], read: boolean) => {
      const updatedIds: Record<string, boolean> = {};
      for (const id of articleIds) {
        updatedIds[id] = true;
      }
      setUpdatedArticles((updated) => ({
        ...updated,
        ...updatedIds,
      }));

      articlesUpdate.submit(
        {
          articleIds: JSON.stringify(articleIds),
          userData: JSON.stringify({ read }),
        },
        { method: 'put', action: '/article' }
      );
    },
    [articlesUpdate]
  );

  return (
    <>
      <ArticlesList
        updatedArticles={updatedArticles}
        onMarkAsRead={handleMarkAsRead}
      />
      <Outlet />
    </>
  );
}
