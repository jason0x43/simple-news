import { json, type LoaderFunction } from '@remix-run/node';
import { useLoaderData, useNavigate, useParams } from '@remix-run/react';
import ArticleView from '~/components/ArticleView';
import { getUserArticle } from '~/models/article.server';
import { getUser } from '~/session.server';

export type LoaderData = {
  article: Awaited<ReturnType<typeof getUserArticle>>;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await getUser(request);
  const article = await getUserArticle({
    id: params.articleId as string,
    userId: user.id,
  });
  return json<LoaderData>({ article });
};

export default function ArticleRoute() {
  const { article } = useLoaderData<LoaderData>();
  const params = useParams();
  const navigate = useNavigate();

  return <ArticleView article={article} onClose={() => {
    navigate(`/reader/${params.feedId}`);
  }} />;
}
