import type { Load } from '@sveltejs/kit';

export const load: Load = async ({ session }) => {
  if (session.user) {
    return {
      status: 302,
      redirect: '/reader'
    };
  }
  return {};
};
