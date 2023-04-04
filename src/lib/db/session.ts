import { createId } from '@paralleldrive/cuid2';
import type { Session, User } from './lib/db.js';
import db from './lib/db.js';

export type { Session };

export type SessionWithUser = Session & {
	user: User;
};

export async function createUserSession(userId: User['id']): Promise<Session> {
	const expires = Number(new Date(Date.now() + 1000 * 60 * 60 * 24 * 7));
	const sess = await db
		.insertInto('session')
		.values({
			id: createId(),
			expires,
			user_id: userId,
			data: '{}'
		})
		.returningAll()
		.executeTakeFirstOrThrow();
	return sess;
}

export async function getSessionWithUser(
	id: Session['id']
): Promise<SessionWithUser | undefined> {
	const session = await db
		.selectFrom('session')
		.selectAll()
		.where('id', '=', id)
		.executeTakeFirst();
	if (!session) {
		return;
	}

	const user = await db
		.selectFrom('user')
		.selectAll()
		.where('id', '=', session.user_id)
		.executeTakeFirst();
	if (!user) {
		return;
	}

	return {
		...session,
		user
	};
}

export async function setSessionData(
	id: Session['id'],
	data: unknown
): Promise<Session> {
	return await db
		.updateTable('session')
		.set({
			data: JSON.stringify(data)
		})
		.where('id', '=', id)
		.returningAll()
		.executeTakeFirstOrThrow();
}

export async function deleteSession(id: Session['id']): Promise<void> {
	await db.deleteFrom('session').where('id', '=', id).executeTakeFirst();
}
