/// <reference lib="dom" />

import {
  datetime,
  forwardRef,
  React,
  useCallback,
  useMemo,
  useState,
} from "../deps.ts";
import { Article, User } from "../../types.ts";
import { className } from "../util.ts";
import { useArticles, useContextMenu, useUser } from "../contexts/mod.tsx";
import { unescapeHtml } from "../../util.ts";

function pluralize(str: string, val: number): string {
  return `${str}${val === 1 ? "" : "s"}`;
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
    return `${diff.weeks} ${pluralize("week", diff.weeks)}`;
  }
  if (diff.days) {
    return `${diff.days} ${pluralize("day", diff.days)}`;
  }
  if (diff.hours) {
    return `${diff.hours} ${pluralize("hour", diff.hours ?? 0)}`;
  }
  return `${diff.minutes} ${pluralize("minute", diff.minutes ?? 0)}`;
}

function getFeed(feedId: number, user: User | undefined) {
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

  const handleSelect = useCallback(() => {
    selectArticle(article.id);
    setArticlesRead([article.id]);
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
      event.stopPropagation();
    },
    [articles, setArticlesRead, hideContextMenu],
  );

  return (
    <div className={cls} ref={ref}>
      <div
        className="Article-heading"
        onClick={handleSelect}
      >
        <div className="Article-feed">{feed?.title}</div>
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
