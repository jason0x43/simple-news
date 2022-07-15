import { prisma } from '$lib/db';
import { clearSessionCookie } from '$lib/session';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async function ({ locals }) {
  if (locals.session) {
    await prisma.session.delete({
      where: {
        id: locals.session.id
      }
    });

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
