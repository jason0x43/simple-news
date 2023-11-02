export async function isLoggedIn() {
	const resp = await fetch("/api/me");
	console.log(await resp.text());
	return resp.status === 200;
}
