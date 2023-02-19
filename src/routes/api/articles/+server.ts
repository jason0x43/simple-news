import type { Article } from '$lib/db/article';
import {
	markArticlesRead,
	type ArticleHeadingWithUserData
} from '$lib/db/article';
import { errorResponse } from '$lib/request';
import { getSessionOrThrow } from '$lib/session';
import type { RequestHandler } from './$types';

export type ArticleUpdateRequest = {
	articleIds: Article['id'][];
	userData: {
		read?: boolean;
		saved?: boolean;
	};
};

export type ArticleUpdateResponse = {
	errors?: {
		articleIds?: string;
		userData?: string;
	};
	articles?: ArticleHeadingWithUserData[];
};

/**
 * Update user data for a set of articles
 */
export const PUT: RequestHandler = async function ({ request }) {
	const session = await getSessionOrThrow(request.headers.get('cookie'));
	const { user } = session;

	const data: ArticleUpdateRequest = await request.json();

	if (!Array.isArray(data.articleIds)) {
		return errorResponse({
			errors: {
				articleIds: 'articleIds must be an array of IDs'
			}
		});
	}

	if (!data.userData) {
		return errorResponse({
			errors: {
				userData: 'UserData must be an object of flags'
			}
		});
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
