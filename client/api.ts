import { Article, UpdateArticleRequest, User } from "../types.ts";

export async function refreshFeeds() {
  await fetch("/refresh");
}

export async function setRead(articleIds: number[], read = true) {
  const body: UpdateArticleRequest = articleIds.map((articleId) => ({
    articleId,
    read,
  }));

  await fetch(`/articles`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
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
  params.set("status", "unread");
  const response = await fetch(`/articles?${params}`);
  return await response.json();
}
