import type { Article } from '$lib/db/article';
import {
	getArticleHeadings,
	markArticlesRead,
	type ArticleHeadingWithUserData
} from '$lib/db/article';
import type { Feed } from '$lib/db/feed';
import { getFeedGroupWithFeeds } from '$lib/db/feedgroup';
import { json } from '$lib/kit';
import { errorResponse } from '$lib/request';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Get article headings for articles from a given set of feed IDs
 */
export const GET: RequestHandler = async function ({ url, locals }) {
	const user = locals.user;
	if (!user) {
		throw error(401, 'not logged in');
	}

	let feedIds: Feed['id'][] | undefined;

	const feedOrGroupId = url.searchParams.get('feedId');
	if (feedOrGroupId) {
		const [type, id] = feedOrGroupId.split('-');
		if (type === 'group') {
			const group = await getFeedGroupWithFeeds(id);
			feedIds = group?.feeds.map(({ id }) => id) ?? [];
		} else {
			feedIds = [id];
		}
	}

	const { articleFilter } = locals.sessionData;
	const articles = await getArticleHeadings({
		userId: user.id,
		feedIds,
		filter: articleFilter
	});

	return json(articles);
};

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
export const PUT: RequestHandler = async function ({ request, locals }) {
	const user = locals.user;
	if (!user) {
		throw error(401, 'not logged in');
	}

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
