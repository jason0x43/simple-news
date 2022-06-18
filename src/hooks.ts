import { getSessionWithUser } from '$lib/db/session';
import type { GetSession, Handle } from '@sveltejs/kit';
import * as cookie from 'cookie';

export const handle: Handle = async ({ event, resolve }) => {
  const cookies = cookie.parse(event.request.headers.get('cookie') ?? '');
  event.locals.session =
    (await getSessionWithUser(cookies.session)) ?? undefined;
  return await resolve(event);
};

export const getSession: GetSession = ({ locals }): App.Session => {
  return {
    id: locals.session?.id as App.Session['id'],
    user: locals.session?.user as App.Session['user']
  };
};
