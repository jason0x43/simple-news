import { json } from '$lib/kit';
import { getUserOrThrow } from '$lib/session';

/**
 * Get current user
 */
export async function GET({ locals }) {
	const user = getUserOrThrow(locals);
	return json(user);
}
