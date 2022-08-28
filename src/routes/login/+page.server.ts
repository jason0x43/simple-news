import type { User } from '$lib/db/schema';
import { createUserSession, deleteSession } from '$lib/db/session';
import { verifyLogin } from '$lib/db/user';
import type { ErrorResponse } from '$lib/request';
import {
  clearSessionCookie,
  createSessionCookie,
  getSessionId
} from '$lib/session';
import type { Action, PageServerLoad } from './$types';

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse =
  | {
      user?: User;
    }
  | ErrorResponse<{ username?: string; password?: string }>;

export const load: PageServerLoad = async ({ request, setHeaders }) => {
  const cookie = request.headers.get('cookie');
  const sessionId = getSessionId(cookie);
  if (sessionId) {
    deleteSession(sessionId);
    setHeaders({
      'set-cookie': clearSessionCookie()
    });
  }
};

export const POST: Action = async function ({ request, setHeaders }) {
  const data = await request.formData();
  const username = data.get('username');
  const password = data.get('password');

  if (typeof username !== 'string' || typeof password !== 'string') {
    return {
      status: 403,
      errors: { username: 'Invalid username or password' }
    };
  }

  const user = verifyLogin({ username, password });

  if (!user) {
    return {
      status: 403,
      errors: { username: 'Invalid username or password' }
    };
  }

  const session = createUserSession(user.id);

  setHeaders({
    'set-cookie': createSessionCookie(session)
  });

  return {
    location: '/'
  };
};
