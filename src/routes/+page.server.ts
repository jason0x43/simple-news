import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

/**
 * Redirect users when accessing the root path
 */
export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) {
		throw redirect(307, '/login');
	}
	throw redirect(307, '/reader');
};
