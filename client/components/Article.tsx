/// <reference lib="dom" />

import {
  datetime,
  forwardRef,
  React,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "../deps.ts";
import { Article, Feed, User } from "../../types.ts";
import { className } from "../util.ts";
import { useArticles, useContextMenu, useUser } from "../contexts/mod.tsx";
import { unescapeHtml } from "../../util.ts";

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

function getOlderIds(
  articles: Article[] | undefined,
  olderThan: number,
) {
  if (!articles) {
    return [];
  }

  return articles.filter(({ published }) => published < olderThan).map((
    { id },
  ) => id);
}

export interface ArticleProps {
  article: Article;
  selectedArticle: number | undefined;
  selectArticle: (id: number) => void;
}

const Article = forwardRef<HTMLDivElement, ArticleProps>((props, ref) => {
  const { article, selectArticle, selectedArticle } = props;
  const { articles, setArticlesRead } = useArticles();
  const { showContextMenu, hideContextMenu } = useContextMenu();
  const { user } = useUser();
  const feed = getFeed(article.feedId, user);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (selectedArticle === article.id) {
      setArticlesRead([article.id]);
    }
  }, [selectedArticle]);

  const handleSelect = useCallback(() => {
    selectArticle(article.id);
  }, [article, selectedArticle]);

  const cls = className("Article", {
    "Article-selected": selectedArticle === article.id,
    "Article-read": article.read && selectedArticle !== article.id,
    "Article-active": isActive,
  });

  const content = useMemo(() => {
    return unescapeHtml(article.content ?? "");
  }, [article.content]);

  const handleMenuClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (isActive) {
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
            const ids = /older/.test(item)
              ? getOlderIds(articles, article.published)
              : [article.id];
            setArticlesRead(ids, !/unread/.test(item));
          },

          onClose: () => setIsActive(false),
        });

        setIsActive(true);
      }

      event.stopPropagation();
    },
    [articles, isActive, setArticlesRead, hideContextMenu],
  );

  return (
    <div className={cls} ref={ref}>
      <div
        className="Article-heading"
        onClick={handleSelect}
      >
        <div
          className={className("Article-feed", {
            "Article-icon": Boolean(feed?.icon),
          })}
        >
          {feed?.icon
            ? (
              <img
                src={feed.icon}
                title={feed?.title}
              />
            )
            : (
              <div className="Article-monogram" title={feed?.title}>
                {feed?.title[0]}
              </div>
            )}
        </div>
        <div className="Article-title">{article.title}</div>
        <div className="Article-age">{getAge(article.published)}</div>
        <div className="Article-menu" onClick={handleMenuClick}>{"\u22ef"}</div>
      </div>
      {selectedArticle === article.id && (
        <div className="Article-container">
          <a
            className="Article-content-header"
            href={article.link}
            target={"_blank"}
          >
            {article.title}
          </a>
          <div
            className="Article-content"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      )}
    </div>
  );
});

export default Article;
