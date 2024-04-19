export async function handle({ event, resolve }) {
	const cookies = event.cookies;
	event.locals.sessionId = cookies.get('session');
	return resolve(event);
}
