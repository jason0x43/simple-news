import type { Password, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import type { FeedGroupWithFeeds } from './feedgroup';

export type UserWithFeeds = User & {
  feedGroups: FeedGroupWithFeeds[];
  password?: never;
};

export async function verifyLogin({
  username,
  password
}: {
  username: User['username'];
  password: Password['hash'];
}): Promise<UserWithFeeds | null> {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      password: true,
      feedGroups: {
        include: {
          feeds: {
            include: {
              feed: true
            }
          }
        }
      }
    }
  });

  if (!user || !user.password) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password.hash);

  if (!isValid) {
    return null;
  }

  const { password: _password, ...userWithoutPassword } = user;

  return userWithoutPassword;
}

export async function getUserById(
  userId: User['id']
): Promise<UserWithFeeds | null> {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      feedGroups: {
        include: {
          feeds: {
            include: {
              feed: true
            }
          }
        }
      }
    }
  });
}
