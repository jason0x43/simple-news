import { deleteSession } from '$lib/db/session';
import { clearSessionCookie } from '$lib/session';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async function ({ locals }) {
  if (locals.session) {
    deleteSession(locals.session.id);

    return {
      status: 302,
      headers: clearSessionCookie({
        location: '/login'
      })
    };
  }

  return {
    status: 302,
    location: '/login'
  };
};
