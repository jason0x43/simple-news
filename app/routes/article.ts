import type { Article } from '@prisma/client';
import { json, type ActionFunction } from '@remix-run/node';
import {
  updateArticlesUserData,
  type ArticleUserData,
} from '~/models/article.server';
import { getUser } from '~/session.server';

export type ActionData = {
  userDatas?: (ArticleUserData & { articleId: Article['id'] })[];
  errors?: {
    articleIds?: string;
    userData?: string;
  };
};

export const action: ActionFunction = async ({ request }) => {
  const user = await getUser(request);
  const formData = await request.formData();

  const articleIds = formData.get('articleIds');
  if (typeof articleIds !== 'string' || articleIds.length === 0) {
    return json<ActionData>(
      { errors: { articleIds: 'Article IDs are required' } },
      { status: 400 }
    );
  }

  const userData = formData.get('userData');
  if (typeof userData !== 'string' || userData.length === 0) {
    return json<ActionData>(
      { errors: { userData: 'User data is required' } },
      { status: 400 }
    );
  }

  return json<ActionData>({
    userDatas: await updateArticlesUserData({
      userId: user.id,
      ids: JSON.parse(articleIds),
      userData: JSON.parse(userData),
    }),
  });
};
