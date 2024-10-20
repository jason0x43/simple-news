import { Db } from "./db.js";
import { Account } from "./schemas/public/Account.js";
import { SessionId } from "./schemas/public/Session.js";

export type AppEnv = {
	Variables: {
		db: Db;
		sessionId?: SessionId;
		account?: Account;
	};
};
