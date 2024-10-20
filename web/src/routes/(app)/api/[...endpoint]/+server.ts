import { env } from "$env/dynamic/private";
import type { RequestEvent } from "./$types.js";

export async function GET(event) {
	return await request(event);
}

export async function DELETE(event) {
	return await request(event);
}

export async function POST(event) {
	return await request(event);
}

export async function PATCH(event) {
	return await request(event);
}

async function request({ request, fetch, locals }: RequestEvent) {
	const url = new URL(
		new URL(request.url).pathname.replace(/^\/api\//, ""),
		env.API_HOST,
	);

	const init: RequestInit = {
		method: request.method,
		headers: {
			Authorization: `Bearer ${locals.sessionId}`,
			"Content-Type": "application/json",
		},
	};

	if (request.method !== "GET") {
		init.body = await request.text();
	}

	const resp = await fetch(url, init);

	return new Response(resp.body, {
		status: resp.status,
		statusText: resp.statusText,
	});
}
