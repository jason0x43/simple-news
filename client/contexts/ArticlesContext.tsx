import { React, useContext, useMemo } from "../deps.ts";
import { Article } from "../../types.ts";
import { getArticles, setRead } from "../api.ts";
import { useFeedStats } from "./FeedStatsContext.tsx";

const noop = () => undefined;

const ArticlesContext = React.createContext<
  {
    articles: Article[] | undefined;
    fetchArticles: (feeds: number[]) => void;
    setArticlesRead: (ids: number[], read?: boolean) => void;
  }
>({ articles: undefined, fetchArticles: noop, setArticlesRead: noop });

export default ArticlesContext;

export interface ArticlesProviderProps {
  articles?: Article[];
}

export const ArticlesProvider: React.FC<ArticlesProviderProps> = (props) => {
  const [articles, setArticles] = React.useState<
    | Article[]
    | undefined
  >(props.articles);
  const { fetchFeedStats } = useFeedStats();

  const value = useMemo(() => ({
    articles,

    fetchArticles: async (feeds: number[]) => {
      try {
        const newArticles = await getArticles(feeds);
        setArticles(newArticles.filter(({ read }) => !read));
      } catch (error) {
        console.error(error);
      }
    },

    setArticlesRead: async (articleIds: number[], newRead = true) => {
      try {
        const matchingArticles = articleIds.map((aid) =>
          articles?.find(({ id }) => id === aid)
        ).filter((val) => Boolean(val)) as Article[];

        if (matchingArticles.length !== articleIds.length) {
          throw new Error("Tried to update unloaded articles");
        }

        const articlesToUpdate = matchingArticles.filter(({ read }) =>
          Boolean(read) !== newRead
        );
        const idsToUpdate = articlesToUpdate.map(({ id }) => id);

        await setRead(idsToUpdate, newRead);

        setArticles(articles?.map((article) => {
          if (articlesToUpdate.includes(article)) {
            return { ...article, read: newRead };
          }
          return article;
        }));

        fetchFeedStats();
      } catch (error) {
        console.error(error);
      }
    },
  }), [articles]);

  return (
    <ArticlesContext.Provider value={value}>
      {props.children}
    </ArticlesContext.Provider>
  );
};

export function useArticles() {
  return useContext(ArticlesContext);
}
