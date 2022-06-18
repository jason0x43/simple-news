import { getArticle } from '$lib/db/article';
import { getSessionUser } from '$lib/session';
import type { RequestHandler } from '@sveltejs/kit';

export const get: RequestHandler = async ({ locals, params }) => {
  const user = getSessionUser(locals);
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
