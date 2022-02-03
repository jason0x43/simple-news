import { datetime, React } from "../deps.ts";
import { useContextMenu } from "./ContextMenu.tsx";
import Button from "./Button.tsx";
import { Article, ArticleHeading, Feed, UserArticle } from "../../types.ts";
import { Settings } from "../types.ts";
import { className } from "../util.ts";
import { unescapeHtml } from "../../util.ts";
import { useWidthObserver } from "../hooks.ts";

const { useEffect, useRef, useState } = React;

function getOlderIds(
  articles: ArticleHeading[],
  olderThan: number,
) {
  return articles.filter(({ published }) => published < olderThan).map((
    { id },
  ) => id);
}

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

export interface ArticlesProps {
  feeds: Feed[] | undefined;
  articles: ArticleHeading[];
  userArticles: { [articleId: number]: UserArticle };
  settings: Settings;
  setArticlesRead: (articleIds: number[], read: boolean) => void;
  selectedFeeds: number[];
  selectedArticle: Article | undefined;
  onSelectArticle: (articleId: number | undefined) => void;
}

const Articles: React.FC<ArticlesProps> = (props) => {
  const {
    feeds,
    articles,
    onSelectArticle,
    settings,
    setArticlesRead,
    selectedArticle,
    selectedFeeds,
    userArticles,
  } = props;
  const updatedArticles = useRef<Set<number>>(new Set());
  const { hideContextMenu, showContextMenu, contextMenuVisible } =
    useContextMenu();
  const [activeArticle, setActiveArticle] = useState<number | undefined>();
  const touchStartRef = useRef<number | undefined>();
  const touchTimerRef = useRef<number | undefined>();
  const selectedArticleRef = useRef<HTMLElement | null>(null);
  const [width, setRef, listRef] = useWidthObserver();
  const [visibleCount, setVisibleCount] = useState(0);

  // Ensure the selected article is added to updatedArticles. This prevents an
  // article that was initially selected after a refresh from disappearing when
  // deselected.
  useEffect(() => {
    if (selectedArticle) {
      updatedArticles.current.add(selectedArticle.id);
    }
  }, [selectedArticle]);

  // Clear the updated articles list if the selected feed set is changed.
  useEffect(() => {
    updatedArticles.current.clear();
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
        !userArticle?.read || updatedArticles.current.has(article.id)
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

  const setRead = (articleIds: number[], read: boolean) => {
    setArticlesRead(articleIds, read);
    for (const id of articleIds) {
      updatedArticles.current.add(id);
    }
  };

  const handleListScroll = (
    event: React.UIEvent<HTMLDivElement>,
  ) => {
    const target = event.nativeEvent.currentTarget! as HTMLDivElement;
    const { clientHeight, scrollHeight, scrollTop } = target;
    const remaining = scrollHeight - (scrollTop + clientHeight);
    if (remaining < 500 && visibleCount < filteredArticles.length) {
      setVisibleCount(Math.min(visibleCount + 50, filteredArticles.length));
    }
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
            const olderIds = getOlderIds(
              filteredArticles,
              article.published,
            );
            setRead(olderIds, read);
          }
        } else {
          setRead([articleId], read);
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
    if (node) {
      selectedArticleRef.current = node;
    }
    node?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
                        onSelectArticle(undefined);
                      } else {
                        onSelectArticle(article.id);
                        setRead([article.id], true);
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
                      setRead(ids, true);
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
