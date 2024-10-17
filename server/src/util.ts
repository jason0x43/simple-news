import crypto from "node:crypto";

/**
 * Get an environment variable, throwing if the variable isn't defined.
 */
export function getEnv(name: string): string {
	const val = process.env[name];
	if (val === undefined) {
		throw new Error(`${name} must be defined`);
	}
	return val;
}

/**
 * Hash a password
 */
export function hashPassword(
	password: string,
	salt = "",
): { hash: string; salt: string } {
	if (!salt) {
		for (let i = 0; i < 8; i++) {
			salt += String.fromCharCode(crypto.randomInt(32, 128));
		}
	}
	const hash = crypto.hash("sha512", password + salt);
	return { salt, hash };
}

/**
 * Try to fetch a URL, with a timeout
 */
export async function quickFetch(
	url: string,
	init?: RequestInit,
): Promise<Response> {
	const aborter = new AbortController();
	setTimeout(() => {
		aborter.abort(new Error(`Request for ${url} timed out`));
	}, 5000);
	return fetch(url, {
		signal: aborter.signal,
		...init,
	});
}

/**
 * Return true if a given string is a valid URL
 */
export function isValidUrl(url: string | undefined): boolean {
	if (!url) {
		return false;
	}

	try {
		const u = new URL(url);
		return Boolean(u);
	} catch {
		return false;
	}
}
