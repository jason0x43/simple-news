import { Hono } from "hono";
import { AppEnv } from "../types.js";
import { accountRequired, adminRequired } from "../middlewares.js";
import { zValidator } from "@hono/zod-validator";
import {
	CreateAccountRequest,
	PasswordLoginRequest,
	SessionResponse,
} from "@jason0x43/reader-types";
import { generateSessionToken } from "../util.js";
import { deleteCookie } from "hono/cookie";
import { SessionId } from "../schemas/public/Session.js";

const app = new Hono<AppEnv>();

export const accountRoutes = app
	.post("/login", zValidator("json", PasswordLoginRequest), async (c) => {
		console.log("Creating session...");
		const db = c.get("db");
		const data = c.req.valid("json");
		const user = await db.getAccountByUsername(data.username);
		await db.validatePassword(user, data.password);
		const token = generateSessionToken();
		const session = await db.addSession(user, token);

		return c.json({
			sessionId: token as SessionId,
			expires: session.expires,
		} satisfies SessionResponse);
	})
	.get("/me", accountRequired, async (c) => {
		const account = c.get("account")!;
		return c.json(account);
	})
	.post(
		"/users",
		adminRequired,
		zValidator("json", CreateAccountRequest),
		async (c) => {
			const data = c.req.valid("json");
			const db = c.get("db");
			const account = await db.addAccount(
				data.email,
				data.username,
				data.password,
			);
			return c.json(account);
		},
	)
	.get("/users", adminRequired, async (c) => {
		const db = c.get("db");
		const users = await db.getAccounts();
		return c.json(users);
	})
	.post("/logout", accountRequired, async (c) => {
		const sessionId = c.get("sessionId");
		if (sessionId) {
			const db = c.get("db");
			await db.deleteSession(sessionId);
			deleteCookie(c, "session");
		}
		return c.json({}, 204);
	});
