import type { Article } from '@prisma/client';
import { Link } from '@remix-run/react';
import classNames from 'classnames';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type TouchEvent,
  type UIEvent,
} from 'react';
import { diffDates } from '~/lib/date';
import { useWidthObserver } from '~/lib/hooks';
import {
  unescapeHtml,
  useArticleFilter,
  useArticles,
  useFeeds,
  useSelectedArticle,
} from '~/lib/util';
import type { ArticleHeadingWithUserData } from '~/models/article.server';
import Button from './Button';
import { useContextMenu } from './ContextMenu';

function getAge(timestamp: number | undefined | null): string {
  if (!timestamp) {
    return '?';
  }

  const date0 = new Date();
  const date1 = new Date(timestamp);
  const diff = diffDates(date0, date1);
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

type ArticlesProps = {
  updatedArticles: Record<Article['id'], boolean>;
  onMarkAsRead: (articleIds: string[], read: boolean) => void;
};

type TimerRef = ReturnType<typeof setTimeout>;

export default function ArticlesList(props: ArticlesProps) {
  const articles = useArticles();
  const { updatedArticles, onMarkAsRead } = props;
  const selectedArticle = useSelectedArticle();
  const articleFilter = useArticleFilter();
  const feeds = useFeeds();
  const { hideContextMenu, showContextMenu, contextMenuVisible } =
    useContextMenu();
  const touchStartRef = useRef<number | undefined>();
  const touchTimerRef = useRef<TimerRef | undefined>();
  const selectedArticleRef = useRef<HTMLLIElement | null>(null);
  const [width, setRef] = useWidthObserver();
  const [visibleCount, setVisibleCount] = useState(() => {
    if (selectedArticle && articles) {
      const selectedIndex = articles.findIndex(
        (article) => article.id === selectedArticle.id
      );
      if (selectedIndex !== -1) {
        return Math.min(selectedIndex + 10, articles.length);
      }
    }
    return 40;
  });
  const [activeArticle, setActiveArticle] = useState<Article['id'] | null>();

  const filteredArticles: ArticleHeadingWithUserData[] = useMemo(() => {
    if (articleFilter === 'all') {
      return articles ?? [];
    }

    if (articleFilter === 'saved') {
      return articles?.filter((article) => article.userData?.saved) ?? [];
    }

    return (
      articles?.filter(
        (article) =>
          !article.userData?.read ||
          article.id in updatedArticles ||
          article.id === selectedArticle?.id
      ) ?? []
    );
  }, [articleFilter, articles, selectedArticle?.id, updatedArticles]);

  const handleListScroll = (event: UIEvent<HTMLDivElement>) => {
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
  };

  const handleMenuClick = (event: {
    currentTarget: HTMLElement;
    pageX: number;
    pageY: number;
    preventDefault?: () => void;
    stopPropagation?: () => void;
  }) => {
    const articleId = event.currentTarget?.getAttribute('data-id');
    if (!articleId) {
      return;
    }

    showContextMenu({
      anchor: { x: event.pageX, y: event.pageY },

      items: [
        'Mark as read',
        'Mark as unread',
        'Mark above as read',
        'Mark above as unread',
        'Mark below as read',
        'Mark below as unread',
      ],

      onSelect: (item: string) => {
        const read = !/unread/.test(item);
        const index = filteredArticles.findIndex(({ id }) => id === articleId)!;

        if (index !== -1) {
          let ids: string[];
          if (/above/.test(item)) {
            ids = filteredArticles.slice(0, index).map((a) => a.id);
          } else if (/below/.test(item)) {
            ids = filteredArticles.slice(index + 1).map((a) => a.id);
          } else {
            ids = [filteredArticles[index].id];
          }
          onMarkAsRead(ids, read);
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

  // Ensure the selected article is scrolled into view if the width of the
  // Articles list changes
  useEffect(() => {
    selectedArticleRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [width]);

  return (
    <div className="Articles" ref={setRef} onScroll={handleListScroll}>
      {renderedArticles.length > 0 ? (
        <>
          <ul className="Articles-list">
            {renderedArticles.map((article) => {
              const feed = feeds?.find(({ id }) => id === article.feedId);
              const isActive = activeArticle === article.id;
              const isSelected = selectedArticle?.id === article.id;
              const isRead = article.userData?.read ?? false;

              return (
                <li
                  className={classNames('Articles-article', {
                    'Articles-active': isActive,
                    'Articles-selected': isSelected,
                    'Articles-read': isRead,
                  })}
                  data-id={article.id}
                  key={article.id}
                  onContextMenu={handleMenuClick}
                  ref={isSelected ? selectedArticleRef : undefined}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                >
                  <Link to={`${article.id}`}>
                    <div className="Articles-icon">
                      {feed?.icon ? (
                        <img
                          src={feed.icon}
                          title={feed?.title}
                          alt={feed?.title}
                        />
                      ) : (
                        <div className="Articles-monogram" title={feed?.title}>
                          {feed?.title[0]}
                        </div>
                      )}
                    </div>

                    <div
                      className="Articles-title"
                      dangerouslySetInnerHTML={{
                        __html: unescapeHtml(article.title ?? ''),
                      }}
                    />

                    <div className="Articles-age">
                      {getAge(article.published ?? undefined)}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="Articles-controls">
            <Button
              onClick={() => {
                onMarkAsRead(
                  filteredArticles.map(({ id }) => id),
                  true
                );
              }}
              label="Mark all read"
              size="large"
            />
          </div>
        </>
      ) : (
        <h3 className="Articles-empty">Nothing to see here</h3>
      )}
    </div>
  );
}
