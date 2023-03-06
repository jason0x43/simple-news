import { getArticle } from '$lib/db/article';
import { getFeed } from '$lib/db/feed';
import type { User } from '$lib/db/user';
import { getUserOrThrow } from '$lib/session';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const start = Date.now();

	let user: User;

	try {
		user = getUserOrThrow(locals);
	} catch (err) {
		throw redirect(307, '/');
	}

	const article = await getArticle({
		id: params.articleId as string,
		userId: user.id
	});
	const feed = article ? await getFeed(article.feed_id) : null;
	const end = Date.now();

	console.log(`article loaded in ${end - start}ms`);

	return { article, feed };
};
