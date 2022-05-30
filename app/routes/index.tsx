import { redirect, type LoaderFunction } from '@remix-run/node';
import { getOptionalUser } from '~/session.server';

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getOptionalUser(request);
  if (user) {
    return redirect('/reader');
  }
  return redirect('/login');
};
