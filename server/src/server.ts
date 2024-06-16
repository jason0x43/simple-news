// This is a wrapper around HyperExpress.Server that tailors its types for this
// use case.

import HyperExpress, {
	DefaultRequestLocals,
	DefaultResponseLocals,
	MiddlewareNext,
} from "hyper-express";
import { Db } from "./db.js";
import { Account } from "./schemas/public/Account.js";
import { Session } from "./schemas/public/Session.js";

export type AppLocals = {
	db: Db;
};

export type UserRouteHandler = (
	request: Request,
	response: Response,
) => Promise<void>;

export type MiddlewareHandler = (
	request: Request,
	response: Response,
) => Promise<void | Error>;

export { MiddlewareNext };

export interface Server
	extends Omit<
		HyperExpress.Server,
		"locals" | "get" | "post" | "delete" | "patch"
	> {
	locals: AppLocals;
	app: Server;

	get: (
		path: string,
		options: { middlewares?: MiddlewareHandler[] },
		handler: UserRouteHandler,
	) => Server;
	post: (
		path: string,
		options: { middlewares?: MiddlewareHandler[] },
		handler: UserRouteHandler,
	) => Server;
	delete: (
		path: string,
		options: { middlewares?: MiddlewareHandler[] },
		handler: UserRouteHandler,
	) => Server;
	patch: (
		path: string,
		options: { middlewares?: MiddlewareHandler[] },
		handler: UserRouteHandler,
	) => Server;
}

export function createServer(locals: AppLocals): Server {
	const hserver = new HyperExpress.Server();
	const server = hserver as unknown as Server;
	server.locals = { ...locals };
	return server;
}

export type Response = Omit<
	HyperExpress.Response<DefaultResponseLocals>,
	"app"
> & { app: Server };

export type Request = Omit<
	HyperExpress.Request<DefaultRequestLocals>,
	"app" | "locals"
> & { app: Server; locals: { account?: Account; session?: Session } };
