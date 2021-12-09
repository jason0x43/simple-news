/// <reference lib="dom" />

import { React, useCallback, useEffect, useRef, useState } from "./deps.ts";
import useArticles from "./hooks/useArticles.ts";
import Article from "./Article.tsx";
import useContextMenu from "./hooks/useContextMenu.ts";
import { className } from "./util.ts";

function getIds(
  articles: { id: number; read?: boolean }[] | undefined,
  centerId: number,
  aboveOrBelow:
    | "above"
    | "below",
) {
  if (!articles) {
    return [];
  }

  const index = articles.findIndex(({ id }) => id === centerId);
  if (index === -1) {
    return [];
  }

  const cmp = aboveOrBelow === "above"
    ? (a: number, b: number) => a < b
    : (a: number, b: number) => a > b;

  return articles.filter((_, i) => cmp(i, index)).map(({ id }) => id);
}

const Articles: React.FC = () => {
  const [selectedArticle, setSelectedArticle] = useState<number>();
  const { articles, setArticlesRead } = useArticles();
  const selectedRef = useRef<HTMLDivElement>(null);
  const { showContextMenu, hideContextMenu, contextMenuVisible } =
    useContextMenu();
  const [activeArticle, setActiveArticle] = useState<number>();

  const handleSelect = useCallback((selected: number) => {
    hideContextMenu();
    if (selected === selectedArticle) {
      setSelectedArticle(undefined);
    } else {
      setSelectedArticle(selected);
    }
  }, [selectedArticle]);

  const handleRightClick = useCallback((event: React.MouseEvent) => {
    const articleId = Number(
      (event.currentTarget as Element).getAttribute("data-article-id"),
    );

    showContextMenu({
      items: [
        "Mark above as read",
        "Mark above as unread",
        "Mark below as read",
        "Mark below as unread",
      ],
      position: { x: event.pageX, y: event.pageY },
      onSelect: (item: string) => {
        if (/above/.test(item)) {
          const ids = getIds(articles, articleId, "above");
          const markUnread = /unread/.test(item);
          setArticlesRead(ids, !markUnread);
        } else if (/below/.test(item)) {
          const ids = getIds(articles, articleId, "below");
          const markUnread = /unread/.test(item);
          setArticlesRead(ids, !markUnread);
        }
        hideContextMenu();
      },
    });

    setActiveArticle(articleId);

    event.preventDefault();
  }, [articles]);

  useEffect(() => {
    if (!contextMenuVisible) {
      setActiveArticle(undefined);
    }
  }, [contextMenuVisible]);

  useEffect(() => {
    if (selectedRef.current && selectedArticle !== undefined) {
      selectedRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedArticle, selectedRef.current]);

  return (
    <div className="Articles">
      {articles?.length ?? 0 > 0
        ? (
          <>
            <ul className="Articles-list">
              {articles?.map((
                article,
              ) => (
                <li
                  className={className("Articles-article", {
                    "Articles-active": article.id === activeArticle,
                  })}
                  key={article.id}
                  data-article-id={article.id}
                  onContextMenu={handleRightClick}
                >
                  <Article
                    ref={selectedArticle === article.id
                      ? selectedRef
                      : undefined}
                    article={article}
                    selectArticle={handleSelect}
                    selectedArticle={selectedArticle}
                  />
                </li>
              ))}
            </ul>
            <div className="Articles-controls">
              <button>Mark all read</button>
            </div>
          </>
        )
        : <h3 className="Articles-empty">Nothing to see here</h3>}
    </div>
  );
};

export default Articles;
