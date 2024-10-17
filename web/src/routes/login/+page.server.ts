import { Api } from "$lib/api.server";
import { type Actions, fail, redirect } from "@sveltejs/kit";

export const actions = {
	default: async ({ cookies, request, url, fetch }) => {
		const data = await request.formData();
		const username = data.get("username");
		const password = data.get("password");
		const next = url.searchParams.get("next") ?? "/";

		if (
			typeof username !== "string" ||
			typeof password !== "string" ||
			!username ||
			!password
		) {
			return fail(400, { invalid: true });
		}

		const api = new Api({ fetch });

		try {
			const sessionId = await api.login(username, password);
			cookies.set("session", sessionId, {
				// send cookie for every page
				path: "/",
				// server side only cookie so you can't use `document.cookie`
				httpOnly: true,
				// only requests from same site can send cookies
				// https://developer.mozilla.org/en-US/docs/Glossary/CSRF
				sameSite: "strict",
				// only sent over HTTPS in production
				secure: process.env.NODE_ENV === "production",
				// set cookie to expire after a month
				maxAge: 60 * 60 * 24 * 30,
			});
		} catch (error) {
			console.log("returning error:", error);
			return fail(401, { invalid: true });
		}

		redirect(302, next);
	},
} satisfies Actions;
