import { env } from "$env/dynamic/private";
import { Client } from "@jason0x43/reader-client";
import type { SessionId } from "@jason0x43/reader-types";

export class Api extends Client {
	constructor(options: { sessionId?: SessionId; fetch?: typeof fetch }) {
		super(env.API_HOST, options);
	}
}
