/* This file is generated and managed by tsync */

export interface User {
  id: UserId;
  email: string;
  username: string;
  config?: Value;
}

export type FeedKind =
  | "Rss";

export interface Feed {
  id: FeedId;
  url: string;
  title: string;
  kind: FeedKind;
  disabled: boolean;
  icon?: string;
  html_url?: string;
}

export interface Article {
  id: ArticleId;
  article_id: string;
  feed_id: FeedId;
  title: string;
  content: string;
  published: OffsetDateTime;
  link?: string;
}

export interface ArticleSummary {
  id: ArticleId;
  article_id: string;
  feed_id: FeedId;
  title: string;
  published: OffsetDateTime;
  link?: string;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
}

export interface CreateSessionRequest {
  username: string;
  password: string;
}

export interface AddFeedRequest {
  url: Url;
  title?: string;
  kind?: FeedKind;
}

export interface UpdateFeedRequest {
  url?: Url;
  title?: string;
}

export interface SessionResponse {
  id: SessionId;
  expires: OffsetDateTime;
}

export interface CreateFeedGroupRequest {
  name: string;
}

export interface FeedGroup {
  id: FeedGroupId;
  name: string;
  user_id: UserId;
}

export interface AddGroupFeedRequest {
  feed_id: FeedId;
}

export interface FeedGroupWithFeeds {
  id: FeedGroupId;
  name: string;
  user_id: UserId;
  feed_ids: Array<FeedId>;
}

export interface FeedStat {
  total: number;
  read: number;
}

export interface FeedStats {
  feeds: Record<FeedId, FeedStat | undefined>;
  saved: number;
}

export type Url = string

export type Value = Record<string, unknown>

export type UserId = string

export type FeedId = string

export type FeedGroupId = string

export type SessionId = string

export type ArticleId = string

export type OffsetDateTime = string
