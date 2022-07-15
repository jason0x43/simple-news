import { getArticle } from '$lib/db/article';
import { unauthResponse } from '$lib/request';
import { getSessionUser } from '$lib/session';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, params }) => {
  const user = getSessionUser(locals);
  if (!user) {
    return unauthResponse();
  }

  const article = await getArticle({
    id: params.articleId,
    userId: user.id
  });

  return {
    status: 200,
    body: {
      article
    }
  };
};
