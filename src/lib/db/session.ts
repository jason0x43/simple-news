import { SessionDataSchema, type SessionData } from '$lib/types.js';
import { createId } from '@paralleldrive/cuid2';
import type { Session, User } from './lib/db.js';
import db from './lib/db.js';

export type { Session };

export const defaultSessionData: SessionData = {
	articleFilter: 'unread'
};

export type SessionWithData = Omit<Session, 'data'> & {
	data: SessionData | undefined;
};

export type SessionWithUser = SessionWithData & {
	user: User;
};

export async function createUserSession(
	userId: User['id']
): Promise<SessionWithData> {
	const expires = Number(new Date(Date.now() + 1000 * 60 * 60 * 24 * 7));
	const sess = await db
		.insertInto('Session')
		.values({
			id: createId(),
			expires,
			userId,
			data: JSON.stringify(defaultSessionData)
		})
		.returningAll()
		.executeTakeFirstOrThrow();
	return {
		...sess,
		data: defaultSessionData
	};
}

export async function getSessionWithUser(
	id: Session['id']
): Promise<SessionWithUser | undefined> {
	const session = await db
		.selectFrom('Session')
		.selectAll()
		.where('id', '=', id)
		.executeTakeFirst();
	if (!session) {
		return;
	}

	const user = await db
		.selectFrom('User')
		.selectAll()
		.where('id', '=', session.userId)
		.executeTakeFirst();
	if (!user) {
		return;
	}

	return {
		...session,
		data: session.data
			? SessionDataSchema.parse(JSON.parse(session.data))
			: undefined,
		user
	};
}

export async function setSessionData(
	id: Session['id'],
	data: SessionData
): Promise<void> {
	await db
		.updateTable('Session')
		.set({
			data: JSON.stringify(data)
		})
		.where('id', '=', id)
		.executeTakeFirst();
}

export async function deleteSession(id: Session['id']): Promise<void> {
	await db.deleteFrom('Session').where('id', '=', id).executeTakeFirst();
}
