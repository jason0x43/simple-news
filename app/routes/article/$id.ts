import type { Article } from '@prisma/client';
import { type ActionFunction, json } from '@remix-run/node';
import { useFetcher } from '@remix-run/react';
import {
  updateArticleUserData,
  type ArticleUserData,
} from '~/models/article.server';
import { getUser } from '~/session.server';

export type ActionData = {
  userData?: ArticleUserData & { articleId: Article['id'] };
  errors?: {
    userData?: string;
  };
};

export const action: ActionFunction = async ({ request, params }) => {
  const user = await getUser(request);
  const id = params.id as string;
  const formData = await request.formData();

  const userData = formData.get('userData');
  if (typeof userData !== 'string' || userData.length === 0) {
    return json<ActionData>(
      { errors: { userData: 'User data is required' } },
      { status: 400 }
    );
  }

  return await updateArticleUserData({
    id,
    userId: user.id,
    userData: JSON.parse(userData),
  });
};

export function useArticleFetcher() {
  return useFetcher<Awaited<ReturnType<typeof action>>>();
}
