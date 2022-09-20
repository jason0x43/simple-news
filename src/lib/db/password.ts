import { getDb } from './lib/db.js';
import type { Password, User } from './schema';

export function getPasswordHash(
  username: User['username']
): Password['hash'] | null {
  const db = getDb();
  const password: Pick<Password, 'hash'> = db
    .prepare<User['username']>(
      `SELECT hash
      FROM Password
      INNER JOIN User
        ON User.id = Password.userId
      WHERE username = ?`
    )
    .get(username);

  return password?.hash ?? null;
}
