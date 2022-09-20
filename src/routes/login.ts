import { redirect, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
	if (locals.user) {
		throw redirect(302, '/reader');
	}
	return new Response();
};
