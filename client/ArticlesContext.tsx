import { React, useCallback } from "./deps.ts";
import { Article } from "../types.ts";
import { getArticles } from "./api.ts";

const ArticlesContext = React.createContext<
  {
    articles: Article[] | undefined;
    fetchArticles: (feeds: number[]) => void;
  }
>({ articles: undefined, fetchArticles: () => undefined });

export default ArticlesContext;

export interface ArticlesProviderProps {
  articles?: Article[];
}

export const ArticlesProvider: React.FC<ArticlesProviderProps> = (props) => {
  const [articles, setArticles] = React.useState<
    | Article[]
    | undefined
  >(props.articles);

  const fetchArticles = useCallback(async (feeds: number[]) => {
    try {
      const newArticles = await getArticles(feeds);
      setArticles(newArticles);
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
