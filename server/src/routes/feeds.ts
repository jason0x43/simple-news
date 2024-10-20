import { Hono } from "hono";
import { AppEnv } from "../types.js";
import { accountRequired } from "../middlewares.js";
import { FeedId } from "../schemas/public/Feed.js";
import { zValidator } from "@hono/zod-validator";
import { AddFeedRequest, UpdateFeedRequest } from "@jason0x43/reader-types";

const app = new Hono<AppEnv>();

export const feedsRoutes = app
	.use("*", accountRequired)
	.get("/", async (c) => {
		const db = c.get("db");
		const feeds = await db.getFeeds();
		return c.json(feeds);
	})
	.post("/", zValidator("json", AddFeedRequest), async (c) => {
		const db = c.get("db");
		const data = c.req.valid("json");
		const feed = await db.addFeed(data);
		return c.json(feed);
	})
	.get("/log", async (c) => {
		const db = c.get("db");
		const logs = await db.getFeedLogs();
		return c.json(logs);
	})
	.get("/refresh", async (c) => {
		const db = c.get("db");
		const feeds = await db.getActiveFeeds();
		await Promise.all(feeds.map((feed) => db.refreshFeed(feed)));
		return c.json({});
	})
	.get("/:id/refresh", async (c) => {
		const db = c.get("db");
		const feedId = c.req.param("id") as FeedId;
		const feed = await db.getFeed(feedId);
		await db.refreshFeed(feed);
		return c.json({});
	})
	.get("/:id/articles", async (c) => {
		const db = c.get("db");
		const feedId = c.req.param("id") as FeedId;
		const articles = await db.getFeedArticles(feedId);
		return c.json(articles);
	})
	.get("/:id/log", async (c) => {
		const db = c.get("db");
		const feedId = c.req.param("id") as FeedId;
		const log = await db.getFeedLog(feedId);
		return c.json(log);
	})
	.get("/:id/stats", async (c) => {
		const db = c.get("db");
		const feedId = c.req.param("id") as FeedId;
		const account = c.get("account")!;
		const log = await db.getFeedStat(account.id, feedId);
		return c.json(log);
	})
	.get("/:id", async (c) => {
		const db = c.get("db");
		const feedId = c.req.param("id") as FeedId;
		const log = await db.getFeed(feedId);
		return c.json(log);
	})
	.delete("/:id", async (c) => {
		const db = c.get("db");
		const feedId = c.req.param("id") as FeedId;
		await db.deleteFeed(feedId);
		return c.json({});
	})
	.patch("/:id", zValidator("json", UpdateFeedRequest), async (c) => {
		const db = c.get("db");
		const feedId = c.req.param("id") as FeedId;
		const data = c.req.valid("json");
		const feed = await db.updateFeed(feedId, data);
		return c.json(feed);
	});
