import '@total-typescript/ts-reset';
import type { SessionWithUser } from '$lib/db/session';

declare global {
	declare namespace App {
		interface Locals {
			session?: SessionWithUser;
		}
	}
}
