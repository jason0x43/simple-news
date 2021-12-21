import {
  Article,
  Feed,
  FeedStats,
  UpdateUserArticleRequest,
  User,
  UserArticle,
} from "../types.ts";

export class ResponseError extends Error {
  private _status: number;
  private _body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this._status = status;
    this._body = body;
  }

  get status() {
    return this._status;
  }

  get body() {
    return this._body;
  }
}

export async function refreshFeeds() {
  await fetch("/refresh");
}

export async function setRead(
  articleIds: number[],
  read = true,
) {
  const body: UpdateUserArticleRequest = articleIds.map((articleId) => ({
    articleId,
    read,
  }));

  const response = await fetch(`/user_articles`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (response.status >= 400) {
    throw new Error(`Error updating articles: ${response.status}`);
  }
}

export async function reprocess() {
  await fetch("/reprocess");
}

export async function getUser(): Promise<User> {
  const response = await fetch("/user");
  return await response.json();
}

export async function login(email: string, password: string): Promise<User> {
  const response = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (response.status >= 400) {
    const body = await response.json();
    throw new ResponseError("Error logging in", response.status, body);
  }

  return await response.json();
}

export async function getArticles(
  feedIds: number[],
): Promise<Article[]> {
  const params = new URLSearchParams();
  params.set("feeds", feedIds.map(String).join(","));
  const response = await fetch(`/articles?${params}`);
  return await response.json();
}

export async function getFeeds(
  feedIds?: number[],
): Promise<Feed[]> {
  const params = new URLSearchParams();
  if (feedIds) {
    params.set("feeds", feedIds.map(String).join(","));
  }
  const response = await fetch(`/feeds?${params}`);
  return await response.json();
}

export async function getFeedStats(
  feedIds?: number[],
): Promise<FeedStats> {
  const params = new URLSearchParams();
  if (feedIds) {
    params.set("feeds", feedIds.map(String).join(","));
  }
  const response = await fetch(`/feedstats?${params}`);
  return await response.json();
}

export async function getUserArticles(
  feedIds?: number[],
): Promise<UserArticle[]> {
  const params = new URLSearchParams();
  if (feedIds) {
    params.set("feeds", feedIds.map(String).join(","));
  }
  const response = await fetch(`/user_articles?${params}`);
  return await response.json();
}
