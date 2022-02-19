import React, { useEffect, useRef, useState } from "react";
import * as datetime from "std/datetime/mod.ts";
import { useContextMenu } from "./ContextMenu.tsx";
import Button from "./Button.tsx";
import { className } from "../util.ts";
import { unescapeHtml } from "../../util.ts";
import { useWidthObserver } from "../hooks.ts";
import { useAppDispatch, useAppSelector } from "../store/mod.ts";
import {
  selectArticle,
  setArticlesRead,
  setOlderArticlesRead,
} from "../store/articles.ts";
import {
  selectArticles,
  selectFeeds,
  selectUserArticles,
} from "../store/articlesSelectors.ts";
import {
  selectSelectedArticle,
  selectSelectedFeeds,
  selectSettings,
  selectUpdatedArticles,
} from "../store/uiSelectors.ts";

function getAge(timestamp: number | undefined): string {
  if (timestamp === undefined) {
    return "?";
  }

  const date0 = new Date();
  const date1 = new Date(timestamp);
  const diff = datetime.difference(date0, date1, {
    units: ["minutes", "hours", "days", "weeks"],
  });
  if (diff.weeks) {
    return `${diff.weeks} w`;
  }
  if (diff.days) {
    return `${diff.days} d`;
  }
  if (diff.hours) {
    return `${diff.hours} h`;
  }
  return `${diff.minutes} m`;
}

const Articles: React.FC = () => {
  const feeds = useAppSelector(selectFeeds);
  const articles = useAppSelector(selectArticles);
  const settings = useAppSelector(selectSettings);
  const userArticles = useAppSelector(selectUserArticles);
  const updatedArticles = useAppSelector(selectUpdatedArticles);
  const selectedArticle = useAppSelector(selectSelectedArticle);
  const selectedFeeds = useAppSelector(selectSelectedFeeds);
  const { hideContextMenu, showContextMenu, contextMenuVisible } =
    useContextMenu();
  const [activeArticle, setActiveArticle] = useState<number | undefined>();
  const touchStartRef = useRef<number | undefined>();
  const touchTimerRef = useRef<number | undefined>();
  const selectedArticleRef = useRef<HTMLElement | null>(null);
  const [width, setRef, listRef] = useWidthObserver();
  const [visibleCount, setVisibleCount] = useState(0);
  const dispatch = useAppDispatch();

  // Clear the updated articles list if the selected feed set is changed.
  useEffect(() => {
    selectedArticleRef.current = null;

    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [selectedFeeds]);

  // Ensure the selected article is scrolled into view if the width of the
  // Articles list changes
  useEffect(() => {
    selectedArticleRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [width]);

  const filteredArticles = articles.filter((article) => {
    const userArticle = userArticles[article.id];

    return article.articleId === selectedArticle?.articleId ||
      settings.articleFilter === "all" ||
      (settings.articleFilter === "unread" && (
        !userArticle?.read || updatedArticles.includes(article.id)
      )) ||
      settings.articleFilter === "saved" && userArticle?.saved;
  });

  useEffect(() => {
    const selectedIndex = filteredArticles.findIndex(({ id }) =>
      id === selectedArticle?.id
    );
    const targetIndex = Math.max(selectedIndex, 0) + 50;
    setVisibleCount(Math.min(filteredArticles.length, targetIndex));
  }, [filteredArticles.length, selectedArticle]);

  const renderedArticles = filteredArticles.slice(0, visibleCount);

  useEffect(() => {
    if (!contextMenuVisible) {
      setActiveArticle(undefined);
    }
  }, [contextMenuVisible]);

  const handleListScroll = (
    event: React.UIEvent<HTMLDivElement>,
  ) => {
    const target = event.nativeEvent.currentTarget! as HTMLDivElement;
    const { clientHeight, scrollHeight, scrollTop } = target;
    const remaining = scrollHeight - (scrollTop + clientHeight);
    if (remaining < 500 && visibleCount < filteredArticles.length) {
      setVisibleCount(Math.min(visibleCount + 50, filteredArticles.length));
    }
    hideContextMenu();
  };

  const handleMenuClick = (
    event: {
      currentTarget: HTMLLIElement;
      pageX: number;
      pageY: number;
      preventDefault?: () => void;
      stopPropagation?: () => void;
    },
  ) => {
    const articleId = Number(event.currentTarget.getAttribute("data-id"));

    showContextMenu({
      anchor: { x: event.pageX, y: event.pageY },

      items: [
        "Mark as read",
        "Mark as unread",
        "Mark older as read",
        "Mark older as unread",
      ],

      onSelect: (item: string) => {
        const read = !/unread/.test(item);

        if (/older/.test(item)) {
          const article = filteredArticles.find(({ id }) => id === articleId)!;
          if (article) {
            dispatch(setOlderArticlesRead({ articleId, read }));
          }
        } else {
          dispatch(setArticlesRead({ articleIds: [articleId], read }));
        }
      },
    });

    setActiveArticle(articleId);

    event.preventDefault?.();
    event.stopPropagation?.();
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLLIElement>) => {
    const { currentTarget } = event;
    const { pageX, pageY } = event.touches[0];
    touchStartRef.current = Date.now();
    touchTimerRef.current = setTimeout(() => {
      handleMenuClick({ currentTarget, pageX, pageY });
    }, 500);
  };

  const handleTouchEnd = () => {
    clearTimeout(touchTimerRef.current);
  };

  const setArticleRef = (node: HTMLLIElement | null) => {
    if (node && node !== selectedArticleRef.current) {
      selectedArticleRef.current = node;
      node.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  return (
    <div className="Articles" ref={setRef} onScroll={handleListScroll}>
      {renderedArticles.length > 0
        ? (
          <>
            <ul className="Articles-list">
              {renderedArticles.map((article) => {
                const feed = feeds?.find(({ id }) => id === article.feedId);
                const isActive = activeArticle === article.id;
                const isSelected = selectedArticle?.id === article.id;
                const isRead = userArticles?.[article.id]?.read;

                return (
                  <li
                    className={className(
                      "Articles-article",
                      {
                        "Articles-active": isActive,
                        "Articles-selected": isSelected,
                        "Articles-read": isRead,
                      },
                    )}
                    data-id={article.id}
                    key={article.id}
                    onContextMenu={handleMenuClick}
                    onClick={() => {
                      hideContextMenu();
                      if (isSelected) {
                        dispatch(selectArticle(undefined));
                      } else {
                        dispatch(selectArticle(article.id));
                      }
                    }}
                    ref={isSelected ? setArticleRef : undefined}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchEnd}
                  >
                    <div className="Articles-icon">
                      {feed?.icon
                        ? <img src={feed.icon} title={feed?.title} />
                        : (
                          <div
                            className="Articles-monogram"
                            title={feed?.title}
                          >
                            {feed?.title[0]}
                          </div>
                        )}
                    </div>

                    <div
                      className="Articles-title"
                      dangerouslySetInnerHTML={{
                        __html: unescapeHtml(article.title),
                      }}
                    />

                    <div className="Articles-age">
                      {getAge(article.published)}
                    </div>
                  </li>
                );
              })}
            </ul>

            {renderedArticles.length > 0 && (
              <div className="Articles-controls">
                <Button
                  onClick={() => {
                    const ids = renderedArticles.map(({ id }) => id);
                    if (ids) {
                      dispatch(
                        setArticlesRead({ articleIds: ids, read: true }),
                      );
                    }
                  }}
                  label="Mark all read"
                  size="large"
                />
              </div>
            )}
          </>
        )
        : filteredArticles.length > 0
        ? undefined
        : <h3 className="Articles-empty">Nothing to see here</h3>}
    </div>
  );
};

export default Articles;
