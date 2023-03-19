import { createFeed, getFeeds, updateFeed } from '$lib/db/feed';
import { downloadFeed } from '$lib/feed.server';
import { json } from '$lib/kit';
import {
	AddFeedRequestSchema,
	type AddFeedRequest,
	type AddFeedResponse,
	type UpdateFeedRequest,
	UpdateFeedRequestSchema,
	type UpdateFeedResponse
} from '$lib/types';
import { error } from '@sveltejs/kit';

/**
 * Get all feeds
 */
export async function GET() {
	const resp = await getFeeds();
	return json(resp);
}

/**
 * Add a new feed
 */
export async function POST({ request }) {
	let data: AddFeedRequest;

	try {
		data = AddFeedRequestSchema.parse(await request.json());
	} catch (err) {
		throw error(400, 'A URL must be provided');
	}

	const parsedFeed = await downloadFeed(data.url);
	const feed = await createFeed({
		url: data.url,
		title: parsedFeed.title ?? data.url
	});

	return json<AddFeedResponse>(feed);
}

/**
 * Update an existing feed
 */
export async function PUT({ request }) {
	let data: UpdateFeedRequest;

	try {
		data = UpdateFeedRequestSchema.parse(await request.json());
	} catch (err) {
		throw error(400, 'A URL must be provided');
	}

	const feed = await updateFeed(data);

	return json<UpdateFeedResponse>(feed);
}
