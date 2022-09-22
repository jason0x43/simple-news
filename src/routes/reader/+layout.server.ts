import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { user, sessionData } = locals;
	if (!user) {
		throw redirect(302, '/login');
	}

	return {
		user,
		articleFilter: sessionData.articleFilter
	};
};
