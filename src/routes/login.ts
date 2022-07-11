import type { RequestHandler } from '@sveltejs/kit';

export const get: RequestHandler = async ({ locals }) => {
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
