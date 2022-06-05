import type { User } from '@prisma/client';
import { createSessionStorage, redirect, type Session } from '@remix-run/node';
import { prisma } from './lib/db';
import invariant from 'tiny-invariant';
import { getUserById, type UserWithFeeds } from './models/user.server';

invariant(process.env.SESSION_SECRET, 'SESSION_SECRET must be set');

const userSessionKey = 'userId';

export const sessionStorage = createSessionStorage({
  cookie: {
    name: '__session',
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === 'production',
  },
  async createData(data, expires) {
    const session = await prisma.session.create({
      data: {
        data: JSON.stringify(data),
        expires: expires !== undefined ? Number(expires) : expires,
      },
    });
    return session.id;
  },
  async readData(id) {
    const session = await prisma.session.findUnique({
      where: {
        id,
      },
    });
    return session?.data ? JSON.parse(session?.data) : null;
  },
  async updateData(id, data, expires) {
    await prisma.session.update({
      where: {
        id,
      },
      data: {
        data: JSON.stringify(data),
        expires: expires !== undefined ? Number(expires) : expires,
      },
    });
  },
  async deleteData(id) {
    await prisma.session.deleteMany({
      where: {
        id,
      },
    });
  },
});

export async function getSession(request: Request) {
  const cookie = request.headers.get('Cookie');
  return sessionStorage.getSession(cookie);
}

export async function commitSession(session: Session) {
  await sessionStorage.commitSession(session);
}

export async function createUserSession({
  request,
  userId,
  redirectTo,
}: {
  request: Request;
  userId: string;
  redirectTo: string;
}) {
  const session = await getSession(request);
  session.set(userSessionKey, userId);
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session, {
        maxAge: 60 * 60 * 24 * 7, // 7 days
      }),
    },
  });
}

export async function requireUserId(request: Request) {
  const userId = await getUserId(request);
  if (!userId) {
    throw redirect(`/login`);
  }
  return userId;
}

export async function getUserId(
  request: Request
): Promise<User['id'] | undefined> {
  const session = await getSession(request);
  return session.get(userSessionKey);
}

export async function getUser(request: Request): Promise<UserWithFeeds> {
  const userId = await getUserId(request);
  if (userId !== undefined) {
    const user = await getUserById(userId);
    if (user) {
      return user;
    }
  }

  throw await logout(request);
}

export async function getOptionalUser(
  request: Request
): Promise<UserWithFeeds | null> {
  const userId = await getUserId(request);
  if (userId === undefined) {
    return null;
  }

  const user = await getUserById(userId);
  if (user) {
    return user;
  }

  throw await logout(request);
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect('/', {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(session),
    },
  });
}
