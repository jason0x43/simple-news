import { Api } from "$lib/api.server";
import { redirect } from "@sveltejs/kit";

export async function load({ fetch, locals, cookies }) {
	const api = new Api({ fetch, sessionId: locals.sessionId });
	await api.logout();

	cookies.set("session", "", { path: "/" });

	return redirect(302, "/login");
}
