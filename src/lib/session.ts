import { error, redirect, type Cookies } from '@sveltejs/kit';
import {
	getSessionWithUser,
	type Session,
	type SessionWithUser
} from './db/session';
import type { User } from './db/user';

const cookieOpts = {
	path: '/',
	httpOnly: true,
	sameSite: 'strict' as const,
	secure: process.env.NODE_ENV === 'production'
};

export function getSessionOrRedirect(locals: App.Locals): SessionWithUser {
	const { session } = locals;
	if (!session) {
		throw redirect(307, '/');
	}
	return session;
}

export function getUserOrRedirect(locals: App.Locals): User {
	const { user } = getSessionOrRedirect(locals);
	return user;
}

export function getSessionId(cookies: Cookies): string | undefined {
	return cookies.get('session');
}

export async function getSession(
	cookies: Cookies
): Promise<SessionWithUser | undefined> {
	const sessionId = getSessionId(cookies);
	return sessionId ? getSessionWithUser(sessionId) : undefined;
}

export async function getSessionOrThrow(
	cookies: Cookies
): Promise<SessionWithUser> {
	const sessionId = getSessionId(cookies);
	const session = sessionId ? await getSessionWithUser(sessionId) : undefined;
	if (!session?.user) {
		throw error(401, 'not logged in');
	}
	return session;
}

export async function getSessionUser(cookies: Cookies): Promise<User> {
	const sessionId = getSessionId(cookies);
	const session = sessionId ? await getSessionWithUser(sessionId) : undefined;
	if (!session?.user) {
		throw error(401, 'not logged in');
	}
	return session.user;
}

export function clearSessionCookie(cookies: Cookies): void {
	cookies.set('session', '', {
		...cookieOpts,
		expires: new Date(0)
	});
}

export function setSessionCookie(
	cookies: Cookies,
	session: Pick<Session, 'id' | 'expires'>
): void {
	cookies.set('session', session.id, {
		...cookieOpts,
		expires: new Date(session.expires)
	});
}
