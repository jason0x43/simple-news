/// <reference lib="dom" />

import { React, useCallback, useEffect, useRef } from "../deps.ts";
import { useContextMenu } from "./ContextMenu.tsx";
import Article from "./Article.tsx";
import Button from "./Button.tsx";
import { Article as ArticleType, User } from "../../types.ts";
import { Settings } from "../types.ts";

function getOlderIds(
  articles: ArticleType[],
  olderThan: number,
) {
  return articles.filter(({ published }) => published < olderThan).map((
    { id },
  ) => id);
}

export interface ArticlesProps {
  user: User;
  articles: ArticleType[];
  settings: Settings;
  setArticlesRead: (articleIds: number[], read: boolean) => void;
  selectedFeeds: number[];
  selectedArticle: number | undefined;
  onSelectArticle: (articleId: number | undefined) => void;
}

const Articles: React.FC<ArticlesProps> = (props) => {
  const {
    articles,
    onSelectArticle,
    settings,
    setArticlesRead,
    selectedArticle,
    selectedFeeds,
    user,
  } = props;
  const recentlyChanged = useRef<Set<number>>(new Set());
  const { hideContextMenu } = useContextMenu();

  useEffect(() => {
    recentlyChanged.current.clear();
  }, [selectedFeeds]);

  const setRead = (articleIds: number[], read: boolean) => {
    setArticlesRead(articleIds, read);
    const op = read ? "add" : "delete";
    for (const id of articleIds) {
      recentlyChanged.current[op](id);
    }
  };

  const handleSelect = useCallback(
    (selected: number) => {
      hideContextMenu();
      if (selected === selectedArticle) {
        onSelectArticle(undefined);
      } else {
        onSelectArticle(selected);
        setRead([selected], true);
      }
    },
    [selectedArticle],
  );

  const handleMarkAll = useCallback(() => {
    if (articles) {
      const ids = articles.map(({ id }) => id);
      setRead(ids, true);
    }
  }, [articles, setArticlesRead]);

  const handleMarkOlder = useCallback((read: boolean) => {
    if (!articles || selectedArticle === undefined) {
      return;
    }

    const article = articles.find(({ id }) => id === selectedArticle);
    if (article) {
      const olderIds = getOlderIds(articles, article?.published);
      setRead(olderIds, read);
    }
  }, [articles, setArticlesRead]);

  const handleMarkArticle = useCallback((articleId: number, read: boolean) => {
    setRead([articleId], read);
  }, [setArticlesRead]);

  const setArticleRef = useCallback((node: HTMLDivElement | null) => {
    node?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="Articles">
      {articles.length > 0
        ? (
          <>
            <ul className="Articles-list">
              {articles?.filter((article) =>
                settings.articleFilter === "all" ||
                settings.articleFilter === "unread" && (!article.read ||
                    recentlyChanged.current.has(article.id)) ||
                settings.articleFilter === "saved" && article.saved
              ).map((article) => (
                <li
                  className="Articles-article"
                  key={article.id}
                  data-article-id={article.id}
                >
                  <Article
                    ref={selectedArticle === article.id
                      ? setArticleRef
                      : undefined}
                    article={article}
                    selectArticle={handleSelect}
                    selectedArticle={selectedArticle}
                    setArticleRead={handleMarkArticle}
                    setOlderArticlesRead={handleMarkOlder}
                    user={user}
                  />
                </li>
              ))}
            </ul>
            <div className="Articles-controls">
              <Button
                onClick={handleMarkAll}
                label="Mark all read"
                size="large"
              />
            </div>
          </>
        )
        : <h3 className="Articles-empty">Nothing to see here</h3>}
    </div>
  );
};

export default Articles;
