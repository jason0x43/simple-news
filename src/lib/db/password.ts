import * as db from './lib/db.js';
import type { Password, User } from './schema';

export function getPasswordHash(
	username: User['username']
): Password['hash'] | undefined {
	return db
		.prepare<User['username']>(
			`SELECT hash
			FROM Password
			INNER JOIN User
			ON User.id = Password.userId
			WHERE username = ?`
		)
		.get<{ hash: string }>(username)?.hash;
}
