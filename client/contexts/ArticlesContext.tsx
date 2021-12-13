import {
  React,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "../deps.ts";
import { Article } from "../../types.ts";
import { getArticles, setRead } from "../api.ts";
import { useFeeds } from "./FeedsContext.tsx";
import { Settings, useSettings } from "./SettingsContext.tsx";

const noop = () => undefined;

const ArticlesContext = React.createContext<
  {
    articles: Article[] | undefined;
    fetchArticles: () => void;
    setArticlesRead: (ids: number[], read?: boolean) => void;
  }
>({ articles: undefined, fetchArticles: noop, setArticlesRead: noop });

export default ArticlesContext;

export interface ArticlesProviderProps {
  articles?: Article[];
}

function filterArticles(
  articles: Article[] | undefined,
  settings: Settings,
) {
  if (articles) {
    if (settings.articleFilter === "unread") {
      return {
        articles: articles.filter(({ read }) => !read),
        filter: "unread",
      };
    }

    if (settings.articleFilter === "saved") {
      return {
        articles: articles.filter(({ saved }) => saved),
        filter: "saved",
      };
    }
  }

  return { articles };
}

export const ArticlesProvider: React.FC<ArticlesProviderProps> = (props) => {
  const { settings } = useSettings();
  const { fetchFeedStats, selectedFeeds } = useFeeds();
  // keep fetched articles in a ref -- these will be used as the source if the
  // article filter changes
  const fetchedArticles = useRef<Article[] | undefined>(props.articles);
  // display articles are a filtered set of fetchedArticles; keep track of what
  // filter was used to prevent unnecessary re-renders
  const [displayArticles, setDisplayArticles] = useState<
    { articles: Article[] | undefined; filter?: string }
  >(filterArticles(props.articles, settings));

  // when settings change, recompute the display articles if necessary
  useEffect(() => {
    if (displayArticles.filter !== settings.articleFilter) {
      setDisplayArticles(filterArticles(fetchedArticles.current, settings));
    }
  }, [settings]);

  // automatically fetch articles every few minutes
  useEffect(() => {
    let canceled = false;

    const interval = setInterval(async () => {
      if (!selectedFeeds) {
        return;
      }

      fetchFeedStats();
      const articles = await getArticles(selectedFeeds);

      if (canceled) {
        return;
      }

      fetchedArticles.current = articles;
      setDisplayArticles({
        ...displayArticles,
        articles: articles.filter((article) =>
          displayArticles.articles?.find((da) => da.id === article.id)
        ),
      });
    }, 600000);

    return () => {
      canceled = true;
      clearInterval(interval);
    };
  }, [displayArticles, selectedFeeds]);

  // memoize the provided value; recompute it if the display articles or the
  // settings change
  const value = useMemo(() => ({
    articles: displayArticles.articles,

    fetchArticles: async () => {
      if (!selectedFeeds) {
        return;
      }

      try {
        const articles = await getArticles(selectedFeeds);
        fetchedArticles.current = articles;
        setDisplayArticles(filterArticles(articles, settings));
      } catch (error) {
        console.error(error);
      }
    },

    setArticlesRead: async (articleIds: number[], newRead = true) => {
      try {
        const matchingArticles = articleIds.map((aid) =>
          fetchedArticles.current?.find(({ id }) => id === aid)
        ).filter((val) => Boolean(val)) as Article[];

        if (matchingArticles.length !== articleIds.length) {
          throw new Error("Tried to update unloaded articles");
        }

        const articlesToUpdate = matchingArticles.filter(({ read }) =>
          Boolean(read) !== newRead
        );
        const idsToUpdate = articlesToUpdate.map(({ id }) => id);

        await setRead(idsToUpdate, newRead);

        // set the `read` flag in the currently fetched articles
        fetchedArticles.current = fetchedArticles.current?.map((article) =>
          articlesToUpdate.includes(article)
            ? { ...article, read: newRead }
            : article
        );

        // set the `read` flag in the displayed articles, but do not simply
        // refilter the fetched articles; doing that will remove the article the
        // user just opened
        setDisplayArticles(
          {
            ...displayArticles,
            articles: displayArticles.articles?.map((article) =>
              articlesToUpdate.includes(article)
                ? { ...article, read: newRead }
                : article
            ),
          },
        );

        fetchFeedStats();
      } catch (error) {
        console.error(error);
      }
    },
  }), [displayArticles, settings]);

  return (
    <ArticlesContext.Provider value={value}>
      {props.children}
    </ArticlesContext.Provider>
  );
};

export function useArticles() {
  return useContext(ArticlesContext);
}
