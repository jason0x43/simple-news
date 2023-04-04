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

export type AddFeedResponse = Feed;

export const UpdateFeedRequestSchema = z.object({
	feed: z.object({
		id: z.string(),
		url: z.string().optional()
	})
});
export type UpdateFeedRequest = z.infer<typeof UpdateFeedRequestSchema>;

export type UpdateFeedResponse = Feed;

export type ArticleFilter = 'unread' | 'all';
