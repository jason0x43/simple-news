import { getSession } from '$lib/session';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const session = await getSession(cookies);
	return {
		user: session?.user,
		sessionId: session?.id,
		sessionData: session?.data
	};
};
