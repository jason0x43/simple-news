import { log } from "../deps.ts";
import { createRowHelpers } from "./util.ts";
import { Session } from "../types.ts";

const {
  columns: sessionColumns,
  query: sessionQuery,
} = createRowHelpers<
  Session
>()(
  "id",
  "userId",
  "expires",
);

export function addSession({ userId, expires }: {
  userId: number;
  expires?: number;
}): Session {
  log.debug(`Adding session for user ${userId} that expires at ${expires}`);
  if (!expires) {
    // expire in 1 year
    expires = Date.now() + 365 * 24 * 60 * 60 * 1000;
  }
  const user = sessionQuery(
    `INSERT INTO sessions (user_id, expires)
    VALUES (:userId, :expires)
    RETURNING ${sessionColumns}`,
    { userId, expires },
  )[0];
  log.debug("Finished add");
  return user;
}

export function getSession(userId: number): Session {
  log.debug(`Getting session for user ${userId}`);
  const session = sessionQuery(
    `SELECT ${sessionColumns} FROM sessions WHERE user_id = (:userId)`,
    { userId },
  )[0];
  if (!session) {
    throw new Error(`No active session for ${userId}`);
  }
  return session;
}

export function getSessions(): Session[] {
  log.debug(`Getting sessions`);
  return sessionQuery(`SELECT ${sessionColumns} FROM sessions`);
}

export function removeSession(id: number): void {
  log.debug(`Removing session ${id}`);
  sessionQuery(`DELETE FROM sessions WHERE id = (:id)`, { id });
}

export function hasActiveSession(userId: number): boolean {
  try {
    const session = getSession(userId);
    return session.expires > Date.now();
  } catch {
    return false;
  }
}
