import bcrypt from 'bcryptjs';
import cuid from 'cuid';
import { getDb } from './index.js';
import { getPasswordHash } from './password.js';
import type { Password, User } from './schema';

export function createUser(userData: Omit<User, 'id'>, password: string) {
  const db = getDb();
  const user: User = db
    .prepare<[User['id'], User['username'], User['email']]>(
      'INSERT INTO User (id, username, email) VALUES (?, ?, ?) RETURNING *'
    )
    .get(cuid(), userData.username, userData.email);
  db.prepare<[Password['hash'], User['id']]>(
    'INSERT INTO Password (hash, userId) VALUES (?, ?)'
  ).run(bcrypt.hashSync(password, 7), user.id);
  return user;
}

export function verifyLogin({
  username,
  password
}: {
  username: User['username'];
  password: Password['hash'];
}): User | null {
  const db = getDb();
  const hash = getPasswordHash(username);

  if (!hash || !bcrypt.compareSync(password, hash)) {
    return null;
  }

  const user: User = db
    .prepare<User['username']>('SELECT * from User WHERE username = ?')
    .get(username);

  return user;
}

export function getUserById(userId: User['id']): User | null {
  const db = getDb();
  const user: User = db
    .prepare<User['id']>('SELECT * FROM User WHERE id = ?')
    .get(userId);
  return user;
}

export function getUserByUsername(username: User['username']): User | null {
  const db = getDb();
  const user: User = db
    .prepare<User['username']>('SELECT * FROM User WHERE username = ?')
    .get(username);
  return user;
}
