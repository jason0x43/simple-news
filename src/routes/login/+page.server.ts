import type { User } from '$lib/db/schema';
import { createUserSession, deleteSession } from '$lib/db/session';
import { verifyLogin } from '$lib/db/user';
import type { ErrorResponse } from '$lib/request';
import {
  clearSessionCookie,
  setSessionCookie,
  getSessionId
} from '$lib/session';
import { invalid, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse =
  | {
      user?: User;
    }
  | ErrorResponse<{ username?: string; password?: string }>;

export const load: PageServerLoad = async ({ request, cookies }) => {
  const cookie = request.headers.get('cookie');
  const sessionId = getSessionId(cookie);
  if (sessionId) {
    deleteSession(sessionId);
    clearSessionCookie(cookies);
  }
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const username = data.get('username');
    const password = data.get('password');

    if (typeof username !== 'string' || typeof password !== 'string') {
      return invalid(403, { username: 'Invalid username or password' });
    }

    const user = verifyLogin({ username, password });

    if (!user) {
      return invalid(403, { username: 'Invalid username or password' });
    }

    const session = createUserSession(user.id);

    setSessionCookie(cookies, session);

    throw redirect(301, '/');
  }
};
