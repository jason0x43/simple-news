import { Hono } from "hono";
import { Db } from "./db.js";
import { getEnv } from "./util.js";
import { accountRequired } from "./middlewares.js";
import { runMigrations } from "./migrate.js";
import { AppEnv } from "./types.js";
import { accountRoutes } from "./routes/account.js";
import { articlesRoutes } from "./routes/articles.js";
import { feedsRoutes } from "./routes/feeds.js";
import { feedgroupsRoutes } from "./routes/feedgroups.js";
import { downloadFeed } from "./feed.js";
import { serve } from "@hono/node-server";

const db = new Db();
const adminUser = getEnv("SN_ADMIN_USER");
const shutdownTasks: (() => void)[] = [];

console.log("Running database migrations...");
await runMigrations(db.db);
console.log("Database is up to date");

console.log("Creating admin user...");
try {
	await db.getAccountByUsername(adminUser);
	console.log(`Admin user ${adminUser} already exists`);
} catch {
	await db.addAccount(adminUser, adminUser, getEnv("SN_ADMIN_PASSWORD"));
	console.log(`Created admin user ${adminUser}`);
}

const app = new Hono<AppEnv>();
const port = Number(process.env.API_PORT ?? 3000);

// Add db to every request
app.use("*", async (c, next) => {
	c.set("db", db);
	await next();
});

// Request logger
app.use(async (c, next) => {
	await next();
	const { status = 200 } = c.res;
	const { method, path } = c.req;
	const url = new URL(c.req.url);
	const search = url.search;
	console.debug(`[${method}] ${path}${search ?? ""} ${status}`);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes = app
	.route("/", accountRoutes)
	.route("/articles", articlesRoutes)
	.route("/feeds", feedsRoutes)
	.route("/feedgroups", feedgroupsRoutes)
	.get("/feedstats", accountRequired, async (c) => {
		const db = c.get("db");
		const account = c.get("account")!;
		const feedStats = await db.getFeedStats(account!.id);
		return c.json(feedStats);
	})
	.get("/feed", accountRequired, async (c) => {
		const url = c.req.query("url")!;
		const feed = await downloadFeed(url);
		return c.json(feed);
	});

export type AppRoutes = typeof routes;

try {
	const server = serve({ fetch: app.fetch, port });
	shutdownTasks.push(() => server.close());
	console.log(`Listening on port ${port}`);
} catch (error) {
	console.log(`Failed to attach to port ${port}:`, error);
}

// Start a periodic refresh task
const envUpdateSec = Number(process.env.FEED_UPDATE_SEC);
const updateSec = isNaN(envUpdateSec) ? 1800 : envUpdateSec;
const updateMs = updateSec * 1000;
const refresher = setInterval(async () => {
	await db.refreshActiveFeeds(updateMs);
}, updateMs);
shutdownTasks.push(() => clearInterval(refresher));

console.log(`Updating feeds every ${updateSec} seconds`);

function shutdown() {
	console.log("Shutting down services...");
	shutdownTasks.forEach((task) => task());
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("SIGQUIT", shutdown);
