import { Article, User } from "../types.ts";

export async function updateFeeds() {
  await fetch("/update");
}

export async function getUser(): Promise<User> {
  const response = await fetch("/user");
  return await response.json();
}

export async function getArticles(feedIds: number[]): Promise<Article[]> {
  const params = new URLSearchParams();
  params.set('feeds', JSON.stringify(feedIds));
  const response = await fetch(`/articles?${params}`);
  return await response.json();
}
