import type { RequestHandler } from '@sveltejs/kit';

export const get: RequestHandler = async ({ locals }) => {
  return {
    status: 302,
    headers: {
      location: locals?.session?.user ? '/reader' : '/login'
    }
  };
};
