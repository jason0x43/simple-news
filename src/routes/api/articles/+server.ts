import { markArticlesRead } from '$lib/db/article';
import { getSessionUser } from '$lib/session';
import {
	ArticleUpdateRequestSchema,
	type ArticleUpdateRequest
} from '$lib/types';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Update user data for a set of articles
 */
export const PUT: RequestHandler = async function ({ cookies, request }) {
	const user = await getSessionUser(cookies);

	let data: ArticleUpdateRequest;

	try {
		data = ArticleUpdateRequestSchema.parse(await request.json());
	} catch (err) {
		throw error(400, 'Invalid request data');
	}

	if (data.userData.read !== undefined) {
		markArticlesRead({
			userId: user.id,
			articleIds: data.articleIds,
			read: data.userData.read
		});
	}

	return new Response();
};
