/* This file is generated and managed by tsync */

export interface User {
  id: UserId;
  email: string;
  username: string;
  config?: Value;
}

export type FeedKind =
  | "rss";

export interface Feed {
  id: FeedId;
  url: string;
  title: string;
  kind: FeedKind;
  last_updated: OffsetDateTime;
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
  title: string;
  kind: FeedKind;
}

export interface SessionResponse {
  id: SessionId;
  expires: OffsetDateTime;
}

export type Uuid = string

export type Url = string

export type Value = Record<string, unknown>

export type UserId = Uuid

export type FeedId = Uuid

export type SessionId = Uuid

export type ArticleId = Uuid

export type OffsetDateTime = string
