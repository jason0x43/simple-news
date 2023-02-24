import { markArticlesRead } from '$lib/db/article';
import { getSessionOrThrow } from '$lib/session';
import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import {
	ArticleUpdateRequestSchema,
	type ArticleUpdateRequest
} from '$lib/types';

/**
 * Update user data for a set of articles
 */
export const PUT: RequestHandler = async function ({ cookies, request }) {
	const session = await getSessionOrThrow(cookies);
	const { user } = session;

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
