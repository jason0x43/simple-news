import type { User } from '$lib/db/schema';
import { createUserSession } from '$lib/db/session';
import { verifyLogin } from '$lib/db/user';
import type { ErrorResponse } from '$lib/request';
import { setSessionCookie } from '$lib/session';
import type { RequestHandler } from '@sveltejs/kit';

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse =
  | {
      user?: User;
    }
  | ErrorResponse<{ username?: string; password?: string }>;

export const POST: RequestHandler<
  Record<string, string>,
  LoginResponse
> = async function ({ request }) {
  const data: LoginRequest = await request.json();
  const user = verifyLogin(data);

  if (!user) {
    return {
      status: 400,
      body: { errors: { username: 'Invalid username or password' } }
    };
  }

  const session = createUserSession(user.id);

  return {
    headers: setSessionCookie(session),
    body: {
      user
    }
  };
};
