import { getArticle } from '$lib/db/article';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, params }) => {
	const { user } = await parent();
	const article = await getArticle({
		id: params.articleId as string,
		userId: user.id
	});
	return { article };
};
