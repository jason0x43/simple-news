import { Api } from "$lib/api.server";
import { fail, redirect } from "@sveltejs/kit";

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
			const session = await api.login(username, password);
			cookies.set("session", session.sessionId, {
				path: "/",
				httpOnly: true,
				sameSite: "lax",
				secure: process.env.NODE_ENV === "production",
				expires: session.expires,
			});
		} catch (error) {
			console.log("returning error:", error);
			return fail(401, { invalid: true });
		}

		redirect(302, next);
	},
};
