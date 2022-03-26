import React, {
  type FC,
  type TouchEvent,
  type UIEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as datetime from "std/datetime/mod.ts";
import { useContextMenu } from "./ContextMenu.tsx";
import Button from "./Button.tsx";
import { className, loadValue, storeValue } from "../util.ts";
import { unescapeHtml } from "../../util.ts";
import { useChangeEffect, useStoredState, useWidthObserver } from "../hooks.ts";
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
import { Activity } from "./Activity.tsx";

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

const scrollDataKey = "scrollData";
type ScrollData = { visibleCount: number; scrollTop: number };
type InitState = {
  scrollTop: number;
  visibleCount: number;
};

const Articles: FC = () => {
  const selectedFeeds = useSelectedFeeds();
  const selectedFeedsRef = useRef(selectedFeeds);
  const { data: feeds, isLoading: feedsLoading } = useFeeds();
  const { data: articles = [], isLoading: articlesLoading } =
    useArticleHeadings(selectedFeeds, {
      refetchInterval: 300_000,
    });
  const { data: userArticles = [], isLoading: userArticlesLoading } =
    useUserArticles(selectedFeeds);
  const settings = useSettings();
  const selectedArticle = useSelectedArticle();
  const setSelectedArticle = useSelectedArticleSetter();
  const { hideContextMenu, showContextMenu, contextMenuVisible } =
    useContextMenu();
  const [activeArticle, setActiveArticle] = useState<number | undefined>();
  const touchStartRef = useRef<number | undefined>();
  const touchTimerRef = useRef<number | undefined>();
  const selectedArticleRef = useRef<HTMLLIElement | null>(null);
  const [width, setRef, listRef] = useWidthObserver();
  const [visibleCount, setVisibleCount] = useState(40);
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
  const [initState, setInitState] = useState<InitState>();
  const scrollTimer = useRef<number>();

  const loading = articlesLoading || userArticlesLoading || feedsLoading;

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
      !userArticlesMap[article.id]?.read ||
      updatedArticles.includes(article.id)
    );
  }, [
    articles,
    userArticlesMap,
    settings.articleFilter,
    updatedArticles,
  ]);

  const handleListScroll = (
    event: UIEvent<HTMLDivElement>,
  ) => {
    const target = event.nativeEvent.currentTarget! as HTMLDivElement;
    const { clientHeight, scrollHeight, scrollTop } = target;
    // Load 20 new articles when we've gotten within 500 pixels of the end of
    // the list
    const remaining = scrollHeight - (scrollTop + clientHeight);
    if (remaining < 500 && visibleCount < filteredArticles.length) {
      const newCount = Math.min(visibleCount + 20, filteredArticles.length);
      setVisibleCount(newCount);
    }
    hideContextMenu();

    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      const data: ScrollData = { visibleCount, scrollTop };
      storeValue(scrollDataKey, data);
    }, 100);
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

  const renderedArticles = filteredArticles.slice(0, visibleCount);

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
  useChangeEffect(() => {
    selectedArticleRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [width]);

  useEffect(() => {
    const scrollData = loadValue<ScrollData>(scrollDataKey);
    if (scrollData) {
      setVisibleCount(scrollData.visibleCount);
      setInitState(scrollData);
    }
  }, []);

  useEffect(() => {
    if (
      initState && listRef.current && renderedArticles.length ===
        initState.visibleCount
    ) {
      listRef.current.scrollTop = initState.scrollTop;
      setInitState(undefined);
    }
  }, [initState, renderedArticles]);

  let content: React.ReactNode;

  if (loading) {
    content = <div className="Articles-loading">
      <Activity />
    </div>;
  } else if (renderedArticles.length > 0) {
    content = (
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
                ref={isSelected ? selectedArticleRef : undefined}
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
      </>
    );
  } else {
    content = <h3 className="Articles-empty">Nothing to see here</h3>;
  }

  return (
    <div className="Articles" ref={setRef} onScroll={handleListScroll}>
      {content}
    </div>
  );
};

export default Articles;
