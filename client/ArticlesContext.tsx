import { React, useCallback } from "./deps.ts";
import { Article } from "../types.ts";
import { getArticles } from "./api.ts";

export interface ArticlesData {
  [feed: number]: Article[];
}

const ArticlesContext = React.createContext<
  {
    articles: ArticlesData | undefined;
    fetchArticles: (feeds: number[]) => void;
  }
>({ articles: undefined, fetchArticles: () => undefined });

export default ArticlesContext;

export interface ArticlesProviderProps {
  articles?: ArticlesData;
}

export const ArticlesProvider: React.FC<ArticlesProviderProps> = (props) => {
  const [articles, setArticles] = React.useState<
    | ArticlesData
    | undefined
  >(props.articles);

  const fetchArticles = useCallback(async (feeds: number[]) => {
    try {
      const feedArticles = await Promise.all(feeds.map(getArticles));
      feeds.forEach((feed, i) => {
        setArticles({
          ...articles,
          [feed]: feedArticles[i],
        });
      });
    } catch (error) {
      console.error(error);
    }
  }, [articles]);

  return (
    <ArticlesContext.Provider value={{ articles, fetchArticles }}>
      {props.children}
    </ArticlesContext.Provider>
  );
};
