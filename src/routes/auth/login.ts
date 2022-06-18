import { createUserSession } from '$lib/db/session';
import { getUserById, verifyLogin, type UserWithFeeds } from '$lib/db/user';
import { setSessionCookie } from '$lib/session';
import type { RequestHandler } from '@sveltejs/kit';

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  user?: UserWithFeeds;
  errors?: { username?: string; password?: string };
};

export const post: RequestHandler<
  Record<string, string>,
  LoginResponse
> = async function ({ request }) {
  const data: LoginRequest = await request.json();
  const user = await verifyLogin(data);

  if (!user) {
    return {
      status: 400,
      body: { errors: { username: 'Invalid username or password' } }
    };
  }

  const session = await createUserSession(user.id);
  const userWithFeeds = (await getUserById(user.id)) as UserWithFeeds;

  return {
    headers: setSessionCookie(session),
    body: {
      user: userWithFeeds
    }
  };
};
