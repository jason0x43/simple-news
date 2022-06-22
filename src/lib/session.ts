import type { Session, User } from '@prisma/client';
import * as cookie from 'cookie';

const options = {
  path: '/',
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production'
};

export function setSessionCookie<T extends Headers | Record<string, string>>(
  session: Session,
  headers?: T
): T {
  return setHeader(
    'set-cookie',
    cookie.serialize('session', session.id, {
      ...options,
      expires: new Date(session.expires)
    }),
    headers
  );
}

export function clearSessionCookie<T extends Headers | Record<string, string>>(
  headers?: T
): T {
  return setHeader(
    'set-cookie',
    cookie.serialize('session', '', {
      ...options,
      expires: new Date(0)
    }),
    headers
  );
}

function setHeader<T extends Headers | Record<string, string>>(
  key: string,
  value: string,
  headers?: T
): T {
  if (!headers) {
    headers = { [key]: value } as T;
  } else if (headers instanceof Headers) {
    headers.set(key, value);
  } else {
    headers[key] = value;
  }
  return headers;
}

export function getSessionUser(locals: App.Locals): User | undefined {
  const { session } = locals;
  return session?.user;
}
