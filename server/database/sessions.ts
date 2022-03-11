import * as log from "std/log/mod.ts";
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
  "sessionId",
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
    `INSERT INTO sessions (session_id, user_id, expires)
    VALUES (:sessionId, :userId, :expires)
    RETURNING ${sessionColumns}`,
    { sessionId: createSessionId(), userId, expires },
  )[0];
  log.debug("Finished add");
  return user;
}

export function getSession(sessionId: string): Session {
  log.debug(`Getting session ${sessionId}`);
  const session = sessionQuery(
    `SELECT ${sessionColumns} FROM sessions WHERE session_id = (:sessionId)`,
    { sessionId },
  )[0];
  if (!session) {
    throw new Error(`No active session with ID ${sessionId}`);
  }
  return session;
}

export function getSessions(): Session[] {
  log.debug(`Getting sessions`);
  return sessionQuery(`SELECT ${sessionColumns} FROM sessions`);
}

export function removeSession(sessionId: string): void {
  log.debug(`Removing session ${sessionId}`);
  sessionQuery(`DELETE FROM sessions WHERE session_id = (:sessionId)`, {
    sessionId,
  });
}

export function isActiveSession(session: Session): boolean {
  return session.expires > Date.now();
}

export function createSessionId(): string {
  return crypto.randomUUID();
}

// This is necessary until TS's types know about randomUUID
declare global {
  interface Crypto {
    randomUUID: () => string;
  }
}
