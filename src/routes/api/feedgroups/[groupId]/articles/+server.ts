import { getArticles, type ArticleWithUserData } from '$lib/db/article';
import { json } from '$lib/kit';
import { getUserOrThrow } from '$lib/session';

/**
 * Request a set of articles
 */
export async function GET({ locals, params }) {
	const user = getUserOrThrow(locals);
	const { groupId } = params;

	let articles: ArticleWithUserData[];

	if (groupId === 'saved') {
		articles = await getArticles(user.id, { filter: 'saved' });
	} else {
		const [type, id] = groupId.split('-');
		if (type === 'group') {
			articles = await getArticles(user.id, { feeds: { group: id } });
		} else {
			articles = await getArticles(user.id, { feeds: { ids: [id] } });
		}
	}

	return json<ArticleWithUserData[]>(articles);
}
