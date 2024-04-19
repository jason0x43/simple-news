import { NODE_ENV } from "$env/static/private";
import type { Cookies } from '@sveltejs/kit';

export function clearSessionCookie(cookies: Cookies): void {
	cookies.set('session', '', {
		path: '/',
		expires: new Date(0)
	});
}

export function setSessionCookie(cookies: Cookies, session: string): void {
	cookies.set('session', session, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: NODE_ENV === 'production',
		maxAge: 60 * 60 * 24 * 7
	});
}
