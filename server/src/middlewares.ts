import { AppError } from "./error.js";
import { Account } from "./schemas/public/Account.js";
import { Session, SessionId } from "./schemas/public/Session.js";
import { Request, Response } from "./server.js";

const baseUrl = process.env.BASE_URL ?? "http://localhost:5173";

export function csrfCheck(req: Request) {
	if (req.method !== "GET") {
		const origin = req.header("Origin");
		// You can also compare it against the Host or X-Forwarded-Host header.
		if (origin != null && origin !== baseUrl) {
			throw new AppError("Invalid origin", 401);
		}
	}
}

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
		request.locals.session = session.session;
		request.locals.account = session.account;
	} catch (err) {
		return err as Error;
	}
}

async function getSession(
	request: Request,
	response: Response,
): Promise<{ session: Session, account: Account }> {
	const headers = request.headers;
	const authHeader = headers["authorization"];
	if (!authHeader) {
		throw new AppError("not authorized", 401);
	}

	if (!/Bearer \S+/.test(authHeader)) {
		throw new AppError("invalid authorization header", 401);
	}

	const sessionId = authHeader.split(" ")[1];

	try {
		const result = await response.app.locals.db.validateSessionToken(
			sessionId as SessionId,
		);

		if (!result.session) {
			throw new AppError(`invalid or expired session ${sessionId}`, 401);
		}

		return result;
	} catch (err) {
		console.warn(`could not get session: `, err);
		throw new AppError("not authorized", 401);
	}
}
