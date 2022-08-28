import * as cookie from 'cookie';
import type { Session } from './db/schema';
import { getSessionWithUser, type SessionWithUser } from './db/session';

const options = {
  path: '/',
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production'
};

export function getSession(
  cookieStr: string | null
): SessionWithUser | undefined {
  if (!cookieStr) {
    return undefined;
  }
  const cookies = cookie.parse(cookieStr);
  return getSessionWithUser(cookies.session) ?? undefined;
}

export function clearSessionCookie(): string {
  return cookie.serialize('session', '', {
    ...options,
    expires: new Date(0)
  });
}

export function createSessionCookie(session: Session): string {
  return cookie.serialize('session', session.id, {
    ...options,
    expires: new Date(session.expires)
  });
}

export function getSessionId(cookieStr: string | null): string | undefined {
  if (!cookieStr) {
    return undefined;
  }
  const cookies = cookie.parse(cookieStr);
  return cookies.session;
}
