/// <reference lib="dom" />

import {
  datetime,
  React,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "../deps.ts";
import { useContextMenu } from "./ContextMenu.tsx";
import Button from "./Button.tsx";
import { Article, Feed, User } from "../../types.ts";
import { Settings } from "../types.ts";
import { className } from "../util.ts";
import { unescapeHtml } from "../../util.ts";

function getOlderIds(
  articles: Article[],
  olderThan: number,
) {
  return articles.filter(({ published }) => published < olderThan).map((
    { id },
  ) => id);
}

export interface ArticlesProps {
  user: User;
  articles: Article[];
  settings: Settings;
  setArticlesRead: (articleIds: number[], read: boolean) => void;
  selectedFeeds: number[];
  selectedArticle: number | undefined;
  onSelectArticle: (articleId: number | undefined) => void;
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

function getFeed(feedId: number, user: User | undefined): Feed | undefined {
  const feedGroups = user?.config?.feedGroups;
  if (feedGroups) {
    for (const group of feedGroups) {
      for (const feed of group.feeds) {
        if (feed.id === feedId) {
          return feed;
        }
      }
    }
  }

  return undefined;
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
  const updatedArticles = useRef<Set<number>>(new Set());
  const { hideContextMenu, showContextMenu, contextMenuVisible } =
    useContextMenu();
  const [activeArticle, setActiveArticle] = useState<number | undefined>();

  useEffect(() => {
    updatedArticles.current.clear();
  }, [selectedFeeds]);

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

  const handleMenuClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const articleId = Number(event.currentTarget.getAttribute("data-id"));

    if (articleId === activeArticle) {
      hideContextMenu();
    } else {
      showContextMenu({
        anchor: event.currentTarget,

        items: [
          "Mark as read",
          "Mark as unread",
          "Mark older as read",
          "Mark older as unread",
        ],

        onSelect: (item: string) => {
          const read = !/unread/.test(item);

          if (/older/.test(item)) {
            const article = articles.find(({ id }) => id === articleId)!;
            if (article) {
              const olderIds = getOlderIds(articles, article.published);
              setRead(olderIds, read);
            }
          } else {
            setRead([articleId], read);
          }
        },
      });

      setActiveArticle(articleId);
    }

    event.stopPropagation();
  };

  const setArticleRef = useCallback((node: HTMLDivElement | null) => {
    node?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const filteredArticles = articles.filter((article) =>
    settings.articleFilter === "all" ||
    settings.articleFilter === "unread" && (!article.read ||
        updatedArticles.current.has(article.id)) ||
    settings.articleFilter === "saved" && article.saved
  );

  return (
    <div className="Articles">
      {filteredArticles.length > 0
        ? (
          <>
            <table className="Articles-list">
              <tbody>
                {filteredArticles.map((article) => {
                  const feed = getFeed(article.feedId, user);
                  const isActive = activeArticle === article.id;
                  const isSelected = selectedArticle === article.id;
                  const isRead = article.read;

                  return (
                    <tr
                      className={className({
                        "Article-active": isActive,
                        "Article-read": isRead,
                      })}
                      key={article.id}
                      ref={isSelected ? setArticleRef : undefined}
                    >
                      <td className="Article-icon">
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
                      </td>

                      <td
                        className="Article-title"
                        onClick={() => {
                          hideContextMenu();
                          if (article.id === selectedArticle) {
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

                      <td className="Article-age">
                        {getAge(article.published)}
                      </td>

                      <td
                        className="Article-menu"
                        data-id={article.id}
                        onClick={handleMenuClick}
                      >
                        {"\u22ef"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="Articles-controls">
              <Button
                onClick={() => {
                  const ids = articles?.map(({ id }) => id);
                  if (ids) {
                    setRead(ids, true);
                  }
                }}
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
