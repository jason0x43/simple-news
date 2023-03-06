import { markArticles } from '$lib/db/article';
import { getUserOrThrow } from '$lib/session';
import {
	ArticleUpdateRequestSchema,
	type ArticleUpdateRequest
} from '$lib/types';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Update user data for a set of articles
 */
export const PUT: RequestHandler = async function ({ locals, request }) {
	const user = getUserOrThrow(locals);

	let data: ArticleUpdateRequest;

	try {
		data = ArticleUpdateRequestSchema.parse(await request.json());
	} catch (err) {
		throw error(400, 'Invalid request data');
	}

	await markArticles({ userId: user.id, ...data });

	return new Response();
};
