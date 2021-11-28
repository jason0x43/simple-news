import { Article, User } from "../types.ts";

export async function updateFeeds() {
  await fetch("/update");
}

export async function getUser(): Promise<User> {
  const response = await fetch("/user");
  return await response.json();
}

export async function getArticles(feedId: number): Promise<Article[]> {
  const response = await fetch(`/articles/${feedId}`);
  return await response.json();
}
