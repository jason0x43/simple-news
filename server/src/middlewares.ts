import { AppError } from "./error.js";
import { Session, SessionId } from "./schemas/public/Session.js";
import { Request, Response } from "./server.js";

/**
 * Check for an admin user
 *
 * At the moment, this just checks for a user
 */
export async function adminRequired(request: Request, response: Response) {
	return sessionRequired(request, response);
}

export async function sessionRequired(request: Request, response: Response) {
	try {
		const session = await getSession(request, response);
		request.locals.session = session;
		const account = await response.app.locals.db.getAccount(session.account_id);
		request.locals.account = account;
	} catch (err) {
		return err as Error;
	}
}

async function getSession(
	request: Request,
	response: Response,
): Promise<Session> {
	const headers = request.headers;
	const authHeader = headers["authorization"];
	if (!authHeader) {
		throw new AppError("not authorized", 401);
	}

	if (!/Bearer \S+/.test(authHeader)) {
		throw new AppError("invalid authorization header", 401);
	}

	const sessionId = authHeader.split(" ")[1];
	const session = await response.app.locals.db.getSession(
		sessionId as SessionId,
	);
	if (session.expires <= new Date()) {
		throw new AppError("session is expired", 401);
	}

	return session;
}
