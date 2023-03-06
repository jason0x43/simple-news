import { getArticle } from '$lib/db/article';
import { getFeed } from '$lib/db/feed';
import { getUserOrRedirect } from '$lib/session';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const start = Date.now();

	const user = getUserOrRedirect(locals);
	const article = await getArticle({
		id: params.articleId as string,
		userId: user.id
	});
	const feed = article ? await getFeed(article.feed_id) : null;
	const end = Date.now();

	console.log(`article loaded in ${end - start}ms`);

	return { article, feed };
};
