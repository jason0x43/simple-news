import bcrypt from 'bcryptjs';
import cuid from 'cuid';
import * as db from './lib/db.js';
import { getPasswordHash } from './password.js';
import type { Password, User } from './schema';

export function createUser(userData: Omit<User, 'id'>, password: string): User {
	const user = db
		.prepare<[User['id'], User['username'], User['email']]>(
			`INSERT INTO User (id, username, email)
			VALUES (?, ?, ?)
			RETURNING *`
		)
		.get<User>(cuid(), userData.username, userData.email);
	if (!user) {
		throw new Error('Unable to create user');
	}
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
}): User | undefined {
	const hash = getPasswordHash(username);

	if (!hash || !bcrypt.compareSync(password, hash)) {
		return;
	}

	return db
		.prepare<User['username']>('SELECT * from User WHERE username = ?')
		.get<User>(username);
}

export function getUserById(userId: User['id']): User | undefined {
	return db
		.prepare<User['id']>('SELECT * FROM User WHERE id = ?')
		.get<User>(userId);
}

export function getUserByUsername(
	username: User['username']
): User | undefined {
	return db
		.prepare<User['username']>('SELECT * FROM User WHERE username = ?')
		.get<User>(username);
}
