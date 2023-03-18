import type { SessionData, UpdateSessionRequest } from '$lib/types';

export async function put(data: UpdateSessionRequest): Promise<SessionData> {
	const resp = await fetch('/api/session', {
		method: 'PUT',
		body: JSON.stringify(data)
	});
	const rdata = (await resp.json()) as SessionData;
	return rdata;
}
