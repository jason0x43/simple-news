import type { Password, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';

export async function verifyLogin({
  username,
  password
}: {
  username: User['username'];
  password: Password['hash'];
}): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      password: true
    }
  });

  if (!user || !user.password) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password.hash);

  if (!isValid) {
    return null;
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function getUserById(userId: User['id']): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      password: false
    }
  });
}
