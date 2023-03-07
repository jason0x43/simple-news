import {
	getFeedArticleHeadings,
	getGroupArticleHeadings,
	getSavedArticleHeadings,
	type ArticleHeadingWithUserData
} from '$lib/db/article';
import { json } from '$lib/kit';
import { getUserOrThrow } from '$lib/session';
import type { RequestHandler } from './$types';

/**
 * Request a set of articles
 */
export const GET: RequestHandler = async ({ locals, params }) => {
	const user = getUserOrThrow(locals);
	const { groupId } = params;
	console.log(params);

	let articleHeadings: ArticleHeadingWithUserData[];

	if (groupId === 'saved') {
		articleHeadings = await getSavedArticleHeadings(user.id);
	} else {
		const [type, id] = groupId.split('-');
		if (type === 'group') {
			articleHeadings = await getGroupArticleHeadings(user.id, id);
		} else {
			articleHeadings = await getFeedArticleHeadings(user.id, id);
		}
	}

	console.log(`got headings for ${groupId}:`, articleHeadings);

	return json<ArticleHeadingWithUserData[]>(articleHeadings);
};
