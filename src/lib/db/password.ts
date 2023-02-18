import db from './lib/db.js';
import type { Password, User } from './lib/db';

export type { Password };

export async function getPasswordHash(
	username: User['username']
): Promise<Password['hash'] | undefined> {
	const result = await db
		.selectFrom('Password')
		.select('hash')
		.innerJoin('User', 'User.id', 'Password.userId')
		.where('username', '=', username)
		.executeTakeFirst();
	return result?.hash;
}
