import handlers from "./handlers.js";
import { createServer } from "./server.js";
import { Db } from "./db.js";
import { getEnv } from "./util.js";
import { adminRequired, sessionRequired } from "./middlewares.js";

const db = new Db();
const adminUser = getEnv("SN_ADMIN_USER");
const shutdownTasks: (() => void)[] = [];

try {
	await db.getAccountByUsername(adminUser);
	console.log(`Admin user ${adminUser} already exists`);
} catch (error) {
	try {
		await db.addAccount(adminUser, adminUser, getEnv("SN_ADMIN_PASSWORD"));
	} catch (err) {
		console.warn(`couldn't create admin user ${adminUser}: ${err}`);
	}
}

const server = createServer({ db });
const port = process.env.SN_API_PORT ?? 3000;

server.set_error_handler((_request, response, error) => {
	console.warn(error);
	const status = "status" in error ? (error.status as number) : undefined;
	return response.status(status || 500).send(error.message);
});

server.use(async (request, response) => {
	response.once("finish", () => {
		const { statusCode = 200 } = response;
		const { method, path, path_query } = request;
		console.debug(
			`[${method}] ${path}${path_query ? "?" + path_query : ""} ${statusCode}`,
		);
	});
});

const userRoute = { middlewares: [sessionRequired] };
const adminRoute = { middlewares: [adminRequired] };

server.get("/me", userRoute, handlers.getSessionUser);
server.post("/users", adminRoute, handlers.createUser);
server.get("/users", adminRoute, handlers.getUsers);
server.post("/login", {}, handlers.createSession);
server.post("/logout", userRoute, handlers.deleteSession);

server.get("/articles", userRoute, handlers.getArticles);
server.patch("/articles", userRoute, handlers.markArticles);
server.get("/articles/:id", userRoute, handlers.getArticle);
server.patch("/articles/:id", userRoute, handlers.markArticle);

server.get("/feeds", userRoute, handlers.getFeeds);
server.post("/feeds", userRoute, handlers.addFeed);
server.get("/feeds/log", userRoute, handlers.getFeedLogs);
server.get("/feeds/refresh", userRoute, handlers.refreshFeeds);
server.get("/feeds/:id/refresh", userRoute, handlers.refreshFeed);
server.get("/feeds/:id/articles", userRoute, handlers.getFeedArticles);
server.get("/feeds/:id/log", userRoute, handlers.getFeedLog);
server.get("/feeds/:id/stats", userRoute, handlers.getFeedStat);
server.get("/feeds/:id", userRoute, handlers.getFeed);
server.delete("/feeds/:id", userRoute, handlers.deleteFeed);
server.patch("/feeds/:id", userRoute, handlers.updateFeed);

server.get("/feedgroups", userRoute, handlers.getFeedGroups);
server.post("/feedgroups", userRoute, handlers.addFeedGroup);
server.delete(
	"/feedgroups/feed/:id",
	userRoute,
	handlers.removeFeedFromAllGroups,
);
server.get("/feedgroups/:id", userRoute, handlers.getFeedGroup);
server.post("/feedgroups/:id", userRoute, handlers.addGroupFeed);
server.get(
	"/feedgroups/:id/articles",
	userRoute,
	handlers.getFeedGroupArticles,
);
server.delete("/feedgroups/:id/:feed_id", userRoute, handlers.deleteGroupFeed);

server.get("/feedstats", userRoute, handlers.getFeedStats);

server.get("/feed", userRoute, handlers.testFeedUrl);

try {
	await server.listen(Number(port));
	shutdownTasks.push(() => server.close());
	console.log(`Listening on port ${port}`);
} catch (error) {
	console.log(`Failed to attach to port ${port}:`, error);
}

// Start a periodic refresh task
const envUpdateSec = Number(process.env.SN_UPDATE_SEC);
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
