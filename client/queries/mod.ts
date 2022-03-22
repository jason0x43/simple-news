import {
  getArticle,
  getArticleHeadings,
  getArticles,
  getFeeds,
  getFeedStats,
  getUser,
  getUserArticles,
  login,
  logout,
  refreshFeeds,
  setRead,
} from "./api.ts";
import { useMutation, useQuery, useQueryClient } from "react-query";
import type { ArticleHeading } from "../../types.ts";
import { useUpdatedArticlesSetter } from "../contexts/updatedArticles.ts";

export function useSignin() {
  const queryClient = useQueryClient();

  return useMutation(async (variables: {
    username: string;
    password: string;
  }) => {
    return await login(variables.username, variables.password);
  }, {
    onSuccess: (data) => {
      queryClient.setQueryData(["user"], data.user);
      queryClient.setQueryData(["feeds"], data.feeds);
      queryClient.setQueryData(["feedStats"], data.feedStats);
    },
  });
}

export function useSignout() {
  const queryClient = useQueryClient();

  return useMutation(async () => {
    await logout();
  }, {
    onSuccess: () => {
      queryClient.setQueryData(["user"], undefined);
    },
  });
}

export function useFeeds() {
  return useQuery("feeds", () => getFeeds());
}

export function useUser() {
  return useQuery("user", () => getUser());
}

export function useFeedStats() {
  return useQuery("feedStats", () => getFeedStats());
}

export function useArticle(articleId: number | undefined) {
  return useQuery(
    ["article", articleId] as const,
    (context) => getArticle(context.queryKey[1] as number),
    {
      enabled: articleId !== undefined,
    },
  );
}

export function useArticles(feedIds: number[] | undefined) {
  return useQuery(
    ["articles", feedIds] as const,
    (context) => getArticles(context.queryKey[1] as number[]),
    {
      enabled: feedIds !== undefined,
    },
  );
}

export function useArticleHeadings(feedIds: number[] | undefined, options?: {
  refetchInterval?: number;
}) {
  return useQuery(
    ["articleHeadings", feedIds] as const,
    (context) => getArticleHeadings(context.queryKey[1] as number[]),
    {
      enabled: feedIds !== undefined,
      ...options,
    },
  );
}

export function useUserArticles(feedIds: number[] | undefined) {
  return useQuery(
    ["userArticles", feedIds] as const,
    (context) => getUserArticles(context.queryKey[1] as number[]),
    {
      enabled: feedIds !== undefined,
    },
  );
}

export function useSetArticlesRead() {
  const queryClient = useQueryClient();
  const setUpdatedArticles = useUpdatedArticlesSetter();

  return useMutation(async (variables: {
    articles: ArticleHeading[];
    read: boolean;
    olderThan?: ArticleHeading;
  }) => {
    const { articles, olderThan, read } = variables;
    let articleIds: number[];

    if (olderThan !== undefined) {
      const articleId = olderThan.id;
      const index = articles.findIndex((article) => article.id === articleId);
      if (index === -1) {
        throw new Error("Article not found");
      }

      console.log(`marking articles older than ${articleId} as read`);
      articleIds = articles.slice(0, index).map(({ id }) => id);
    } else {
      articleIds = articles.map(({ id }) => id);
      console.log(`marking ${JSON.stringify(articleIds)} as read`);
    }

    return await setRead(articleIds, read, false);
  }, {
    onSuccess: (data) => {
      console.log("got data:", data);
      console.log("invalidating queries");
      setUpdatedArticles((updated) => [
        ...updated,
        ...data.map(({ articleId }) => articleId),
      ]);
      queryClient.invalidateQueries(["userArticles"]);
    },
  });
}

export function useRefreshFeeds() {
  const queryClient = useQueryClient();

  return useMutation(async () => {
    await refreshFeeds();
  }, {
    onSuccess: () => {
      queryClient.invalidateQueries(["feedStats"]);
      queryClient.invalidateQueries(["articles"]);
    },
  });
}
