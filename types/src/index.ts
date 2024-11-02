import { z } from "zod";

export type ArticleId = string & { __brand: "ArticleId" };
export const ArticleId = z.custom<ArticleId>(
	(val) => z.string().safeParse(val).success,
);

export type FeedId = string & { __brand: "FeedId" };
export const FeedId = z.custom<FeedId>(
	(val) => z.string().safeParse(val).success,
);

export type AccountId = string & { __brand: "AccountId" };
export const AccountId = z.custom<AccountId>(
	(val) => z.string().safeParse(val).success,
);

export type SessionId = string & { __brand: "SessionId" };
export const SessionId = z.custom<SessionId>(
	(val) => z.string().safeParse(val).success,
);

export type FeedGroupId = string & { __brand: "FeedGroupId" };
export const FeedGroupId = z.custom<FeedGroupId>(
	(val) => z.string().safeParse(val).success,
);

export const AccountResponse = z.object({
	id: AccountId,
	email: z.string(),
	username: z.string(),
	config: z.optional(z.object({})),
});
export type AccountResponse = z.infer<typeof AccountResponse>;

export const DownloadedArticle = z.object({
	article_id: z.string(),
	title: z.string(),
	content: z.string(),
	published: z.union([z.string(), z.date()]),
	link: z.union([z.string(), z.null(), z.undefined()]).optional(),
});
export type DownloadedArticle = z.infer<typeof DownloadedArticle>;

export const DownloadedFeed = z.object({
	title: z.string(),
	link: z.string(),
	icon: z.string().optional(),
	articles: z.array(DownloadedArticle),
});
export type DownloadedFeed = z.infer<typeof DownloadedFeed>;

export const Feed = z.object({
	id: FeedId,
	title: z.string(),
	url: z.string(),
	kind: z.string(),
	disabled: z.boolean(),
	icon: z.nullable(z.string()),
	html_url: z.nullable(z.string()),
});
export type Feed = z.infer<typeof Feed>;

export const FeedsResponse = z.array(Feed);
export type FeedsResponse = z.infer<typeof FeedsResponse>;

export const FeedGroup = z.object({
	id: FeedGroupId,
	account_id: z.string(),
	name: z.string(),
});
export type FeedGroup = z.infer<typeof FeedGroup>;

export const FeedGroupWithFeeds = FeedGroup.extend({
	feed_ids: z.array(FeedId),
});
export type FeedGroupWithFeeds = z.infer<typeof FeedGroupWithFeeds>;

export const FeedGroupsResponse = z.array(FeedGroupWithFeeds);
export type FeedGroupsResponse = z.infer<typeof FeedGroupsResponse>;

export const Article = z.object({
	id: ArticleId,
	article_id: z.string(),
	feed_id: FeedId,
	title: z.string(),
	content: z.string(),
	published: z.string().datetime(),
	link: z.nullable(z.string()),
});
export type Article = z.infer<typeof Article>;

export const ArticleSummary = Article.omit({ content: true }).extend({
	read: z.nullable(z.boolean()),
	saved: z.nullable(z.boolean()),
});
export type ArticleSummary = z.infer<typeof ArticleSummary>;

export const ArticlesResponse = z.array(ArticleSummary);
export type ArticlesResponse = z.infer<typeof ArticlesResponse>;

export const FeedStat = z.object({
	total: z.number().int(),
	read: z.number().int(),
	saved: z.number().int(),
});
export type FeedStat = z.infer<typeof FeedStat>;

export const FeedStats = z.record(FeedStat);
export type FeedStats = z.infer<typeof FeedStats>;

export const CreateAccountRequest = z.object({
	email: z.string(),
	username: z.string(),
	password: z.string(),
});
export type CreateAccountRequest = z.infer<typeof CreateAccountRequest>;

export const CreateAccountResponse = z.object({
	id: AccountId,
	username: z.string(),
});
export type CreateAccountResponse = z.infer<typeof CreateAccountResponse>;

export const PasswordLoginRequest = z.object({
	username: z.string(),
	password: z.string(),
});
export type PasswordLoginRequest = z.infer<typeof PasswordLoginRequest>;

export const SessionResponse = z.object({
	sessionId: SessionId,
	expires: z.coerce.date(),
});
export type SessionResponse = z.infer<typeof SessionResponse>;

export const MarkArticlesRequest = z.object({
	articleIds: z.array(ArticleId),
	mark: z.object({
		read: z.optional(z.boolean()),
		saved: z.optional(z.boolean()),
	}),
});
export type MarkArticlesRequest = z.infer<typeof MarkArticlesRequest>;

export const MarkArticleRequest = z.object({
	mark: z.object({
		read: z.optional(z.boolean()),
		saved: z.optional(z.boolean()),
	}),
});
export type MarkArticleRequest = z.infer<typeof MarkArticleRequest>;

export const AddFeedRequest = z.object({
	url: z.string().url(),
	title: z.string(),
	kind: z.optional(z.enum(["rss"])),
});
export type AddFeedRequest = z.infer<typeof AddFeedRequest>;

export const UpdateFeedRequest = z.object({
	url: z.optional(z.string().url()),
	title: z.optional(z.string()),
});
export type UpdateFeedRequest = z.infer<typeof UpdateFeedRequest>;

export const AddFeedGroupRequest = z.object({
	name: z.string(),
});
export type AddFeedGroupRequest = z.infer<typeof AddFeedGroupRequest>;

export const AddGroupFeedRequest = z.object({
	feed_id: FeedId,
	move_feed: z.boolean(),
});
export type AddGroupFeedRequest = z.infer<typeof AddGroupFeedRequest>;

export const FeedLog = z.object({
	id: z.string(),
	feed_id: z.string(),
	time: z.string().datetime(),
	success: z.boolean(),
	message: z.nullable(z.string()),
});
export type FeedLog = z.infer<typeof FeedLog>;
