import { markArticles } from '$lib/db/article';
import { getFeedStats } from '$lib/db/feed';
import { json } from '$lib/kit';
import { getUserOrThrow } from '$lib/session';
import {
	ArticleUpdateRequestSchema,
	type ArticleUpdateResponse,
	type ArticleUpdateRequest
} from '$lib/types';
import { error } from '@sveltejs/kit';

/**
 * Update user data for a set of articles
 */
export async function PUT({ locals, request }) {
	const user = getUserOrThrow(locals);

	let data: ArticleUpdateRequest;

	try {
		data = ArticleUpdateRequestSchema.parse(await request.json());
	} catch (err) {
		throw error(400, 'Invalid request data');
	}

	const updatedArticles = await markArticles({ userId: user.id, ...data });

	const feedStats = await getFeedStats(user.id);
	return json<ArticleUpdateResponse>({
		updatedArticles,
		feedStats
	});
}
