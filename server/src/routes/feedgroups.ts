import { Hono } from "hono";
import { AppEnv } from "../types.js";
import { accountRequired } from "../middlewares.js";
import { FeedId } from "../schemas/public/Feed.js";
import { FeedGroupId } from "../schemas/public/FeedGroup.js";
import { zValidator } from "@hono/zod-validator";
import {
	AddFeedGroupRequest,
	AddGroupFeedRequest,
} from "@jason0x43/reader-types";

const app = new Hono<AppEnv>();

export const feedgroupsRoutes = app
	.use("*", accountRequired)
	.get("/", async (c) => {
		const db = c.get("db");
		const account = c.get("account")!;
		const feedGroups = await db.getFeedGroups(account!.id);
		return c.json(feedGroups);
	})
	.post("/", zValidator("json", AddFeedGroupRequest), async (c) => {
		const db = c.get("db");
		const account = c.get("account")!;
		const data = c.req.valid("json");
		const feedGroup = await db.addFeedGroup(account!.id, data);
		return c.json(feedGroup);
	})
	.delete("/feed/:id", async (c) => {
		const db = c.get("db");
		const feedId = c.req.param("id") as FeedId;
		const account = c.get("account")!;
		await db.removeFeedFromAllGroups(account!.id, feedId);
		return c.json({});
	})
	.get("/:id", async (c) => {
		const db = c.get("db");
		const feedGroupId = c.req.param("id") as FeedGroupId;
		const account = c.get("account")!;
		const feedGroup = await db.getFeedGroup(account!.id, feedGroupId);
		return c.json(feedGroup);
	})
	.post("/:id", zValidator("json", AddGroupFeedRequest), async (c) => {
		const db = c.get("db");
		const account = c.get("account")!;
		const feedGroupId = c.req.param("id") as FeedGroupId;
		const data = c.req.valid("json");
		const feedGroup = await db.addGroupFeed(account!.id, feedGroupId, data);
		return c.json(feedGroup);
	})
	.get("/:id/articles", async (c) => {
		const db = c.get("db");
		const feedGroupId = c.req.param("id") as FeedGroupId;
		const account = c.get("account")!;
		const articles = await db.getFeedGroupArticles(account!.id, feedGroupId);
		return c.json(articles);
	})
	.delete("/:id/:feed_id", async (c) => {
		const db = c.get("db");
		const feedGroupId = c.req.param("id") as FeedGroupId;
		const feedId = c.req.param("feed_id") as FeedId;
		const account = c.get("account")!;
		await db.removeFeedFromGroup(account!.id, feedGroupId, feedId);
		return c.json({});
	});
