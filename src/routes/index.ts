import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
  return {
    status: 302,
    headers: {
      location: locals?.session?.user ? '/reader' : '/login'
    }
  };
};
