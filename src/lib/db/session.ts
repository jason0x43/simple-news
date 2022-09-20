import { getDb } from './lib/db.js';
import type { Session, User } from './schema';
import cuid from 'cuid';

export type SessionWithUser = Session & {
	user: User;
};

export type ArticleFilter = 'all' | 'unread' | 'saved';

export type SessionData = {
	articleFilter: ArticleFilter;
};

export const defaultSessionData: SessionData = {
	articleFilter: 'unread'
};

export function createUserSession(userId: User['id']): Session {
	const db = getDb();
	const expires = Number(new Date(Date.now() + 1000 * 60 * 60 * 24 * 7));
	const session: Session = db
		.prepare<[Session['id'], Session['expires'], Session['userId'], string]>(
			'INSERT INTO Session (id, expires, userId, data) VALUES (?, ?, ?, ?)' +
				' RETURNING *'
		)
		.get(cuid(), expires, userId, JSON.stringify(defaultSessionData));
	return session;
}

export function getSessionWithUser(id: Session['id']): SessionWithUser | null {
	if (!id) {
		return null;
	}

	const db = getDb();
	const session: SessionWithUser | null = db
		.prepare<Session['id']>('SELECT * FROM Session WHERE id = ?')
		.get(id);
	if (session) {
		const user: User = db
			.prepare<User['id']>('SELECT * FROM User WHERE id = ?')
			.get(session.userId);
		return {
			...session,
			user
		};
	}

	return null;
}

export function setSessionData(id: Session['id'], data: SessionData): void {
	const db = getDb();
	db.prepare<[string, Session['id']]>(
		'UPDATE Session SET data = ? WHERE id = ?'
	).run(JSON.stringify(data), id);
}

export function deleteSession(id: Session['id']): void {
	const db = getDb();
	db.prepare<Session['id']>('DELETE FROM Session WHERE id = ?').run(id);
}
