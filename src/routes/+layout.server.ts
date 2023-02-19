import { getSession } from '$lib/session';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ request }) => {
	const session = await getSession(request.headers.get('cookie'));
	return {
		user: session?.user,
		sessionId: session?.id,
		sessionData: session?.data
	};
};
