import { Hono } from "hono";
import { AppEnv } from "../types.js";
import {
	MarkArticleRequest,
	MarkArticlesRequest,
} from "@jason0x43/reader-types";
import { zValidator } from "@hono/zod-validator";
import { ArticleId } from "../schemas/public/Article.js";
import { accountRequired } from "../middlewares.js";

const app = new Hono<AppEnv>();

export const articlesRoutes = app
	.use("*", accountRequired)
	.get("/", async (c) => {
		const db = c.get("db");
		const account = c.get("account")!;
		const saved = c.req.query("saved") === "true";
		const articles = await db.getArticles(account!, { saved });
		return c.json(articles);
	})
	.patch("/", zValidator("json", MarkArticlesRequest), async (c) => {
		const db = c.get("db");
		const account = c.get("account")!;
		const data = c.req.valid("json");
		await db.markArticles(account!, data.articleIds as ArticleId[], data.mark);
		return c.json({});
	})
	.get("/:id", async (c) => {
		const db = c.get("db");
		const articleId = c.req.param("id") as ArticleId;
		const article = await db.getArticle(articleId);
		return c.json(article);
	})
	.patch("/:id", zValidator("json", MarkArticleRequest), async (c) => {
		const db = c.get("db");
		const account = c.get("account")!;
		const articleId = c.req.param("id") as ArticleId;
		const data = c.req.valid("json");
		await db.markArticles(account!, [articleId] as ArticleId[], data.mark);
		return c.json({});
	});
