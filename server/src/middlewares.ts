import { HTTPException } from "hono/http-exception";
import { SessionId } from "./schemas/public/Session.js";
import { AppEnv } from "./types.js";
import { createMiddleware } from "hono/factory";

/**
 * Check for an admin user
 *
 * At the moment, this just checks for a user
 */
export const adminRequired = createMiddleware<AppEnv>(async (c, next) => {
	await accountRequired(c, next);
});

/**
 * Check for a valid session
 */
export const accountRequired = createMiddleware<AppEnv>(async (c, next) => {
	const authHeader = c.req.header("authorization");
	if (!authHeader) {
		throw new HTTPException(401, { message: "not authorized" });
	}

	if (!/Bearer \S+/.test(authHeader)) {
		throw new HTTPException(401, { message: "invalid authorization header" });
	}

	const sessionId = authHeader.split(" ")[1];
	try {
		const result = await c
			.get("db")
			.validateSessionToken(sessionId as SessionId);

		if (!result.session) {
			throw new HTTPException(401, { message: "invalid or expired session" });
		}

		c.set("sessionId", result.session.id);
		c.set("account", result.account);
	} catch {
		throw new HTTPException(401, { message: "invalid or expired session" });
	}

	await next();
});
