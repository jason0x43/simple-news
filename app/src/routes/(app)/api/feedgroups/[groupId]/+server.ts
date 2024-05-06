import { Api } from '$lib/api.server';
import type { AddGroupFeedRequest } from '$server';

export async function POST({ request, fetch, locals, params }) {
	const data: AddGroupFeedRequest = await request.json();
	const { groupId } = params;
	const { feed_id: feedId } = data;
	const api = new Api({ fetch, sessionId: locals.sessionId });
	await api.addGroupFeed({ groupId, feedId });

	return new Response('ok');
}
