import { error, type Cookies } from '@sveltejs/kit';
import * as cookie from 'cookie';
import type { Session } from './db/lib/db';
import { getSessionWithUser, type SessionWithUser } from './db/session';

const options = {
	path: '/',
	httpOnly: true,
	sameSite: 'strict' as const,
	secure: process.env.NODE_ENV === 'production'
};

export async function getSession(
	cookieStr: string | null
): Promise<SessionWithUser | undefined> {
	if (!cookieStr) {
		return;
	}
	const cookies = cookie.parse(cookieStr);
	return getSessionWithUser(cookies.session);
}

export async function getSessionOrThrow(
	cookieStr: string | null
): Promise<SessionWithUser> {
	const session = await getSession(cookieStr);
	if (!session?.user) {
		throw error(401, 'not logged in');
	}
	return session;
}

export function clearSessionCookie(cookies: Cookies): void {
	cookies.set('session', '', {
		...options,
		expires: new Date(0)
	});
}

export function setSessionCookie(
	cookies: Cookies,
	session: Pick<Session, 'id' | 'expires'>
): void {
	cookies.set('session', session.id, {
		...options,
		expires: new Date(session.expires)
	});
}

export function getSessionId(cookieStr: string | null): string | undefined {
	if (!cookieStr) {
		return;
	}
	const cookies = cookie.parse(cookieStr);
	return cookies.session;
}
