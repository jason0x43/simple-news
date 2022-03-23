import React, {
  type FC,
  type TouchEvent,
  type UIEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as datetime from "std/datetime/mod.ts";
import { useContextMenu } from "./ContextMenu.tsx";
import Button from "./Button.tsx";
import { className } from "../util.ts";
import { unescapeHtml } from "../../util.ts";
import { useStoredState, useWidthObserver } from "../hooks.ts";
import {
  useArticleHeadings,
  useFeeds,
  useSetArticlesRead,
  useUserArticles,
} from "../queries/mod.ts";
import { useSelectedFeeds } from "../contexts/selectedFeeds.ts";
import { useSettings } from "../contexts/settings.ts";
import {
  useSelectedArticle,
  useSelectedArticleSetter,
} from "../contexts/selectedArticle.ts";
import { UserArticle } from "../../types.ts";

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

const Articles: FC = () => {
  const selectedFeeds = useSelectedFeeds();
  const selectedFeedsRef = useRef(selectedFeeds);
  const { data: feeds } = useFeeds();
  const { data: articles = [] } = useArticleHeadings(selectedFeeds, {
    refetchInterval: 300_000,
  });
  const settings = useSettings();
  const { data: userArticles = [] } = useUserArticles(selectedFeeds);
  const selectedArticle = useSelectedArticle();
  const setSelectedArticle = useSelectedArticleSetter();
  const { hideContextMenu, showContextMenu, contextMenuVisible } =
    useContextMenu();
  const [activeArticle, setActiveArticle] = useState<number | undefined>();
  const touchStartRef = useRef<number | undefined>();
  const touchTimerRef = useRef<number | undefined>();
  const selectedArticleRef = useRef<HTMLElement | null>(null);
  const [width, setRef, listRef] = useWidthObserver();
  const [visibleCount, setVisibleCount] = useState(0);
  const [updatedArticles, setUpdatedArticles] = useStoredState<number[]>(
    "updatedArticles",
    selectedArticle !== undefined ? [selectedArticle] : [],
  );
  const setArticlesRead = useSetArticlesRead((updated) => {
    setUpdatedArticles((current) => [
      ...current,
      ...updated.map(({ articleId }) => articleId),
    ]);
  });

  const userArticlesMap = useMemo(
    () =>
      userArticles?.reduce((all, userArticle) => {
        all[userArticle.articleId] = userArticle;
        return all;
      }, {} as { [articleId: number]: UserArticle }),
    [userArticles],
  );

  const filteredArticles = useMemo(() => {
    if (settings.articleFilter === "all") {
      return articles;
    }

    if (settings.articleFilter === "saved") {
      return articles.filter((article) => userArticlesMap[article.id]?.saved);
    }

    return articles.filter((article) =>
      article.id === selectedArticle ||
      !userArticlesMap[article.id]?.read ||
      updatedArticles.includes(article.id)
    );
  }, [
    articles,
    userArticlesMap,
    selectedArticle,
    settings.articleFilter,
    updatedArticles,
  ]);

  const handleListScroll = (
    event: UIEvent<HTMLDivElement>,
  ) => {
    const target = event.nativeEvent.currentTarget! as HTMLDivElement;
    const { clientHeight, scrollHeight, scrollTop } = target;
    const remaining = scrollHeight - (scrollTop + clientHeight);
    if (remaining < 500 && visibleCount < filteredArticles.length) {
      setVisibleCount(Math.min(visibleCount + 20, filteredArticles.length));
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
        const article = filteredArticles.find(({ id }) => id === articleId)!;

        if (/older/.test(item)) {
          if (article) {
            setArticlesRead.mutate({
              articles: filteredArticles,
              olderThan: article,
              read,
            });
          }
        } else {
          setArticlesRead.mutate({ articles: [article], read });
        }
      },
    });

    setActiveArticle(articleId);

    event.preventDefault?.();
    event.stopPropagation?.();
  };

  const handleTouchStart = (event: TouchEvent<HTMLLIElement>) => {
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

  const renderedArticles = filteredArticles.slice(0, visibleCount);

  useEffect(() => {
    const selectedIndex = filteredArticles.findIndex(({ id }) =>
      id === selectedArticle
    );
    const targetIndex = Math.max(selectedIndex, 0) + 20;
    setVisibleCount(Math.min(filteredArticles.length, targetIndex));
  }, [filteredArticles, selectedArticle]);

  useEffect(() => {
    if (!contextMenuVisible) {
      setActiveArticle(undefined);
    }
  }, [contextMenuVisible]);

  // Clear the updated articles list if the selected feed set is changed.
  useEffect(() => {
    if (selectedFeeds) {
      if (!selectedFeedsRef.current) {
        // selectedFeeds was just initialized -- set the ref to this value
        selectedFeedsRef.current = selectedFeeds;
      } else {
        // selectedFeeds changed
        selectedFeedsRef.current = selectedFeeds;
        selectedArticleRef.current = null;
        setUpdatedArticles([]);

        if (listRef.current) {
          listRef.current.scrollTop = 0;
        }
      }
    }
  }, [selectedFeeds]);

  // Ensure the selected article is scrolled into view if the width of the
  // Articles list changes
  useEffect(() => {
    selectedArticleRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [width]);

  return (
    <div className="Articles" ref={setRef} onScroll={handleListScroll}>
      {renderedArticles.length > 0
        ? (
          <>
            <ul className="Articles-list">
              {renderedArticles.map((article) => {
                const feed = feeds?.find(({ id }) => id === article.feedId);
                const isActive = activeArticle === article.id;
                const isSelected = selectedArticle === article.id;
                const isRead = userArticlesMap?.[article.id]?.read;

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
                        setSelectedArticle(undefined);
                      } else {
                        setSelectedArticle(article.id);
                        setArticlesRead.mutate({
                          articles: [article],
                          read: true,
                        });
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
                    setArticlesRead.mutate({
                      articles: renderedArticles,
                      read: true,
                    });
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
