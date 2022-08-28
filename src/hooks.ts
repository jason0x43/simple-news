import { defaultSessionData, getSessionWithUser } from '$lib/db/session';
import type { GetSession, Handle } from '@sveltejs/kit';
import * as cookie from 'cookie';

export const handle: Handle = async ({ event, resolve }) => {
  const cookies = cookie.parse(event.request.headers.get('cookie') ?? '');
  const session = getSessionWithUser(cookies.session) ?? undefined;
  event.locals.session = session;
  event.locals.sessionData = session?.data
    ? JSON.parse(session.data)
    : defaultSessionData;
  return await resolve(event);
};

export const getSession: GetSession = ({ locals }): App.Session => {
  return {
    id: locals.session?.id as App.Session['id'],
    user: locals.session?.user as App.Session['user'],
    data: locals.sessionData
  };
};
