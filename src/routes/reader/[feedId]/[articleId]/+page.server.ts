import { getArticleContent } from '$lib/article';
import { getArticle, markArticles } from '$lib/db/article';
import { getFeed, getFeedStats } from '$lib/db/feed';
import type { User } from '$lib/db/user';
import { getUserOrThrow } from '$lib/session';
import { redirect } from '@sveltejs/kit';

export async function load({ locals, parent, params }) {
	let user: User;

	try {
		user = getUserOrThrow(locals);
	} catch (err) {
		throw redirect(307, '/');
	}

	let { feedStats } = await parent();
	const article = await getArticle({
		id: params.articleId,
		userId: user.id
	});
	const feed = article ? await getFeed(article.feed_id) : null;

	if (!article.read) {
		await markArticles({
			articleIds: [article.id],
			userId: user.id,
			userData: { read: true }
		});
		article.read = 1;
		feedStats = await getFeedStats(user.id);
	}

	article.content = getArticleContent(article);

	return { article, feed, feedStats };
}
