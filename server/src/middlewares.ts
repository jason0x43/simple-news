import { HTTPException } from "hono/http-exception";
import { AppError } from "./error.js";
import { SessionId } from "./schemas/public/Session.js";
import { AppEnv } from "./types.js";
import { createMiddleware } from "hono/factory";

const baseUrl = process.env.BASE_URL ?? "http://localhost:5173";

export const csrfCheck = createMiddleware<AppEnv>(async (c, next) => {
	if (c.req.method !== "GET") {
		const origin = c.req.header("Origin");
		// You can also compare it against the Host or X-Forwarded-Host header.
		if (origin != null && origin !== baseUrl) {
			throw new AppError("Invalid origin", 401);
		}
	}
	await next();
});

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
	const result = await c.get("db").validateSessionToken(sessionId as SessionId);
	if (!result.session) {
		throw new HTTPException(401, { message: "invalid or expired session" });
	}

	c.set("sessionId", result.session.id);
	c.set("account", result.account);

	await next();
});
