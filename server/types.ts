/* This file is generated and managed by tsync */

export interface User {
  id: Uuid;
  email: string;
  username: string;
  config?: Value;
}

export type FeedKind =
  | "rss";

export interface Feed {
  id: Uuid;
  url: Url;
  title: string;
  kind: FeedKind;
  last_updated: number;
  disabled: boolean;
  icon?: string;
  html_url?: Url;
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
  id: Uuid;
  expires: number;
}

export type Uuid = string

export type Url = string

export type Value = Record<string, unknown>
