import { createUserSession, deleteSession } from '$lib/db/session';
import { verifyLogin } from '$lib/db/user';
import { clearSessionCookie, setSessionCookie } from '$lib/session';
import { fail, redirect } from '@sveltejs/kit';

export type LoginRequest = {
	username: string;
	password: string;
};

/**
 * Redirect users when accessing the root path
 */
export async function load({ locals }) {
	const { session } = locals;
	if (session) {
		throw redirect(307, '/reader');
	}
}

export const actions = {
	login: async function ({ request, cookies }) {
		const data = await request.formData();
		const username = data.get('username');
		const password = data.get('password');

		if (typeof username !== 'string' || typeof password !== 'string') {
			return fail(403, { username: 'Invalid username or password' });
		}

		const user = await verifyLogin({ username, password });
		if (!user) {
			return fail(403, { username: 'Invalid username or password' });
		}

		const session = await createUserSession(user.id);

		setSessionCookie(cookies, session);

		throw redirect(302, '/reader');
	},

	logout: async function ({ locals, cookies }) {
		const { session } = locals;
		if (session) {
			await deleteSession(session.id);
			clearSessionCookie(cookies);
		}
		throw redirect(302, '/');
	}
};
