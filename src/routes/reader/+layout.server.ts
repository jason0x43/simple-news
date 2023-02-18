import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { user, sessionData } = locals;
	if (!user) {
		console.log('no active user -- redirecting to login');
		throw redirect(302, '/');
	}

	return {
		user,
		articleFilter: sessionData.articleFilter
	};
};
