import db from './lib/db.js';
import type { Password, User } from './lib/db';

export type { Password };

export async function getPasswordHash(
	username: User['username']
): Promise<Password['hash'] | undefined> {
	const result = await db
		.selectFrom('password')
		.select('hash')
		.innerJoin('user', 'user.id', 'password.user_id')
		.where('username', '=', username)
		.executeTakeFirst();
	return result?.hash;
}
