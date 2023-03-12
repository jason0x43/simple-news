import { createOrGetFeed, getFeeds } from '$lib/db/feed';
import { downloadFeed } from '$lib/feed.server';
import { json } from '$lib/kit';
import {
	AddFeedRequestSchema,
	type AddFeedRequest,
	type AddFeedResponse,
	type GetFeedsResponse
} from '$lib/types';
import { error } from '@sveltejs/kit';

/**
 * Get all feeds
 */
export async function GET() {
	const resp: GetFeedsResponse = await getFeeds();
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
	const feed = await createOrGetFeed({
		url: data.url,
		title: parsedFeed.title ?? data.url
	});

	const resp: AddFeedResponse = { feed };

	return json(resp);
}
