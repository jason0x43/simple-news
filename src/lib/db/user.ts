import bcrypt from 'bcryptjs';
import { createId } from '@paralleldrive/cuid2';
import db from './lib/db.js';
import { getPasswordHash } from './password.js';
import type { Password, User } from './lib/db.js';

export type { User };

export async function createUser(
	userData: Omit<User, 'id'>,
	password: string
): Promise<User> {
	const user = await db
		.insertInto('user')
		.values({
			id: createId(),
			username: userData.username,
			email: userData.email
		})
		.returningAll()
		.executeTakeFirstOrThrow();
	await db
		.insertInto('password')
		.values({
			hash: bcrypt.hashSync(password, 7),
			user_id: user.id
		})
		.executeTakeFirst();
	return user;
}

export async function verifyLogin({
	username,
	password
}: {
	username: User['username'];
	password: Password['hash'];
}): Promise<User | undefined> {
	const hash = await getPasswordHash(username);
	if (!hash || !bcrypt.compareSync(password, hash)) {
		return;
	}

	return db
		.selectFrom('user')
		.selectAll()
		.where('username', '=', username)
		.executeTakeFirst();
}

export async function getUserById(userId: User['id']): Promise<User> {
	return db
		.selectFrom('user')
		.selectAll()
		.where('id', '=', userId)
		.executeTakeFirstOrThrow();
}

export async function getUserByUsername(
	username: User['username']
): Promise<User> {
	return db
		.selectFrom('user')
		.selectAll()
		.where('username', '=', username)
		.executeTakeFirstOrThrow();
}
