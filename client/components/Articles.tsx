/// <reference lib="dom" />

import {
  datetime,
  React,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "../deps.ts";
import { useContextMenu } from "./ContextMenu.tsx";
import Button from "./Button.tsx";
import { Article, ArticleHeading, Feed, UserArticle } from "../../types.ts";
import { Settings } from "../types.ts";
import { cancellableEffect, className } from "../util.ts";
import { unescapeHtml } from "../../util.ts";

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
  const [renderedArticles, setRenderedArticles] = useState<ArticleHeading[]>(
    [],
  );
  const { hideContextMenu, showContextMenu, contextMenuVisible } =
    useContextMenu();
  const [activeArticle, setActiveArticle] = useState<number | undefined>();
  const touchStartRef = useRef<number | undefined>();
  const touchTimerRef = useRef<number | undefined>();

  console.log(`rendering ${renderedArticles.length} articles`);

  useEffect(() => {
    updatedArticles.current.clear();
  }, [selectedFeeds]);

  const filteredArticles = useMemo(() =>
    articles.filter((article) => {
      const userArticle = userArticles[article.id];
      return settings.articleFilter === "all" ||
        settings.articleFilter === "unread" && (
            !userArticle?.read || updatedArticles.current.has(article.id)
          ) ||
        settings.articleFilter === "saved" && userArticle?.saved;
    }), [articles, settings.articleFilter, userArticles]);

  useEffect(() =>
    cancellableEffect((signal) => {
      let timer: number | undefined;

      if (renderedArticles[0] !== filteredArticles[0]) {
        setRenderedArticles(filteredArticles.slice(0, 50));
      } else if (renderedArticles.length < filteredArticles.length) {
        const { length } = renderedArticles;
        timer = setTimeout(() => {
          if (!signal.cancelled) {
            setRenderedArticles(filteredArticles.slice(0, length + 50));
          }
        }, 250);
      }

      return () => {
        clearTimeout(timer);
      };
    }), [filteredArticles, renderedArticles]);

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

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLLIElement>) => {
      const { currentTarget } = event;
      const { pageX, pageY } = event.touches[0];
      touchStartRef.current = Date.now();
      touchTimerRef.current = setTimeout(() => {
        handleMenuClick({ currentTarget, pageX, pageY });
      }, 500);
    },
    [],
  );

  const handleTouchEnd = useCallback(() => {
    clearTimeout(touchTimerRef.current);
  }, []);

  const setArticleRef = useCallback((node: HTMLLIElement | null) => {
    node?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  return (
    <div className="Articles">
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
                        "Article-active": isActive,
                        "Article-selected": isSelected,
                        "Article-read": isRead,
                      },
                    )}
                    data-id={article.id}
                    key={article.id}
                    onContextMenu={handleMenuClick}
                    ref={isSelected ? setArticleRef : undefined}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchEnd}
                  >
                    <div className="Article-icon">
                      {feed?.icon
                        ? <img src={feed.icon} title={feed?.title} />
                        : (
                          <div
                            className="Article-monogram"
                            title={feed?.title}
                          >
                            {feed?.title[0]}
                          </div>
                        )}
                    </div>

                    <div
                      className="Article-title"
                      onClick={() => {
                        hideContextMenu();
                        if (article.id === selectedArticle?.id) {
                          onSelectArticle(undefined);
                        } else {
                          onSelectArticle(article.id);
                          setRead([article.id], true);
                        }
                      }}
                      dangerouslySetInnerHTML={{
                        __html: unescapeHtml(article.title),
                      }}
                    />

                    <div className="Article-age">
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
                    const ids = renderedArticles?.map(({ id }) => id);
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
