import { Article, FeedStats, UpdateArticleRequest, User } from "../types.ts";

export async function refreshFeeds() {
  await fetch("/refresh");
}

export async function setRead(articleIds: number[], read = true) {
  const body: UpdateArticleRequest = articleIds.map((articleId) => ({
    articleId,
    read,
  }));

  const response = await fetch(`/articles`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (response.status !== 204) {
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

export async function getArticles(
  feedIds: number[],
): Promise<Article[]> {
  const params = new URLSearchParams();
  params.set("feeds", feedIds.map(String).join(","));
  const response = await fetch(`/articles?${params}`);
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
