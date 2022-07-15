import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
  if (locals.session?.user) {
    return {
      status: 302,
      headers: {
        location: '/reader'
      }
    };
  }
  return {};
};
