import { Article, User } from "../types.ts";

export async function refreshFeeds() {
  await fetch("/refresh");
}

export async function reprocess() {
  await fetch("/reprocess");
}

export async function getUser(): Promise<User> {
  const response = await fetch("/user");
  return await response.json();
}

export async function getArticles(feedIds: number[]): Promise<Article[]> {
  const params = new URLSearchParams();
  params.set("feeds", feedIds.map(String).join(','));
  const response = await fetch(`/articles?${params}`);
  return await response.json();
}
