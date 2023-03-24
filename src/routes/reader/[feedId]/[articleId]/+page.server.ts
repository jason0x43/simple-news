import { getUserOrThrow } from '$lib/session';
import { redirect } from '@sveltejs/kit';

export async function load({ locals, params }) {
	try {
		getUserOrThrow(locals);
	} catch (err) {
		throw redirect(307, '/');
	}

	return { articleId: params.articleId };
}
