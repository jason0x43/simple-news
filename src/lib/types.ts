import { z } from 'zod';
import type { Feed } from './db/feed';
import type { FeedGroupWithFeeds } from './db/feedgroup';
import type { UserArticle } from './db/lib/db';

export const GetFeedStatsResponseSchema = z.object({
	feeds: z.record(
		z.object({
			total: z.number(),
			read: z.number()
		})
	),
	saved: z.number()
});
export type GetFeedStatsResponse = z.infer<typeof GetFeedStatsResponseSchema>;

export const ArticleUpdateRequestSchema = z.object({
	articleIds: z.array(z.string()),
	userData: z.object({
		read: z.boolean().optional(),
		saved: z.boolean().optional()
	})
});
export type ArticleUpdateRequest = z.infer<typeof ArticleUpdateRequestSchema>;
export type ArticleUpdateResponse = {
	updatedArticles: UserArticle[];
	feedStats: GetFeedStatsResponse;
};

export type GetFeedGroupsResponse = FeedGroupWithFeeds[];

export type GetFeedsResponse = Feed[];

export const AddFeedRequestSchema = z.object({
	url: z.string()
});
export type AddFeedRequest = z.infer<typeof AddFeedRequestSchema>;

export type AddFeedResponse = {
	errors?: Record<string, string>;
	feed?: Feed;
};

export type UpdateSessionRequest = SessionData;

export const ArticleFilterSchema = z.union([
	z.literal('all'),
	z.literal('unread')
]);
export type ArticleFilter = z.infer<typeof ArticleFilterSchema>;

export const SessionDataSchema = z.object({
	articleFilter: ArticleFilterSchema
});
export type SessionData = z.infer<typeof SessionDataSchema>;
