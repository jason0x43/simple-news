import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = ({ locals }) => {
  if (!locals.user) {
    throw redirect(307, '/login');
  }
  throw redirect(307, '/reader');
};
