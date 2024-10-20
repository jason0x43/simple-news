import { Client } from "@jason0x43/reader-client";
import type { SessionId } from "@jason0x43/reader-types";
import { redirect } from "@sveltejs/kit";

export async function handle({ event, resolve }) {
	const cookies = event.cookies;
	const sessionId = cookies.get("session") as SessionId;

	if (!sessionId && event.url.pathname !== "/login") {
		throw redirect(301, "/login");
	}

	if (sessionId) {
		// Extend the cookie lifetime whenever a session request is made
		const expires = new Date();
		expires.setDate(expires.getDate() + 15);

		event.cookies.set("session", sessionId, {
			path: "/",
			httpOnly: true,
			sameSite: "lax",
			expires,
			secure: process.env.NODE_ENV === "production",
		});

		event.locals.sessionId = sessionId;
		event.locals.client = new Client("/api/");
	}

	return resolve(event);
}
