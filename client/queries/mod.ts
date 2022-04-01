import {
  getArticle,
  getArticleHeadings,
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
import type { ArticleHeading, UserArticle } from "../../types.ts";

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
  return useQuery(["feeds"], () => getFeeds(), {
    staleTime: 5000,
  });
}

export function useUser() {
  return useQuery(["user"], () => getUser(), {
    staleTime: 5000,
  });
}

export function useFeedStats() {
  return useQuery(["feedStats"], () => getFeedStats(), {
    staleTime: 5000,
  });
}

export function useArticle(articleId: number | undefined) {
  return useQuery(
    ["article", articleId] as const,
    () => {
      if (articleId != null) {
        return getArticle(articleId);
      }
      return null;
    },
    {
      enabled: articleId !== undefined,
      staleTime: 5000,
    },
  );
}

export function useArticleHeadings(feedIds: number[] | undefined, options?: {
  refetchInterval?: number;
}) {
  return useQuery(
    ["articleHeadings", feedIds] as const,
    () => {
      if (feedIds) {
        return getArticleHeadings(feedIds);
      }
      return [];
    },
    {
      enabled: feedIds !== undefined,
      staleTime: 5000,
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
      staleTime: 5000,
    },
  );
}

export function useSetArticlesRead(
  onSuccess?: (updatedArticles: UserArticle[]) => void,
) {
  const queryClient = useQueryClient();

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

      articleIds = articles.slice(0, index).map(({ id }) => id);
    } else {
      articleIds = articles.map(({ id }) => id);
    }

    return await setRead(articleIds, read, false);
  }, {
    onSuccess: (data) => {
      onSuccess?.(data);
      queryClient.invalidateQueries(["userArticles"]);
      queryClient.invalidateQueries(["feedStats"]);
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
      queryClient.invalidateQueries(["articleHeadings"]);
    },
  });
}
