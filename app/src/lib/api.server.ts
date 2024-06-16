import { env } from "$env/dynamic/private";
import { Client } from "simple-news-client";

export class Api extends Client {
	constructor(options: { sessionId?: string; fetch?: typeof fetch }) {
		super(env.API_HOST, options);
	}
}
