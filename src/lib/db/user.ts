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
		.insertInto('User')
		.values({
			id: createId(),
			username: userData.username,
			email: userData.email
		})
		.returningAll()
		.executeTakeFirstOrThrow();
	await db
		.insertInto('Password')
		.values({
			hash: bcrypt.hashSync(password, 7),
			userId: user.id
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
		.selectFrom('User')
		.selectAll()
		.where('username', '=', username)
		.executeTakeFirst();
}

export async function getUserById(userId: User['id']): Promise<User> {
	return db
		.selectFrom('User')
		.selectAll()
		.where('id', '=', userId)
		.executeTakeFirstOrThrow();
}

export async function getUserByUsername(
	username: User['username']
): Promise<User> {
	return db
		.selectFrom('User')
		.selectAll()
		.where('username', '=', username)
		.executeTakeFirstOrThrow();
}
