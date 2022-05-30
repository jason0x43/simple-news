import type { Feed } from '@prisma/client';
import { Link } from '@remix-run/react';
import { useState } from 'react';
import {
  className,
  getFeedsFromGroup,
  getFeedsFromUser,
  useSelectedFeedIds,
} from '~/lib/util';
import type { FeedStats } from '~/models/feed.server';
import type { UserWithFeeds } from '~/models/user.server';
import type { ArticleFilter } from '~/routes/reader';

function isSelected(feeds: Feed[], selected: Feed['id'][] | undefined) {
  if (!selected) {
    return false;
  }
  return feeds.every(({ id }) => selected.includes(id));
}

function getArticleCount(
  feeds: Feed[],
  feedStats: FeedStats,
  articleFilter: ArticleFilter
): number {
  return feeds.reduce((acc, feed) => {
    const stats = feedStats[feed.id];
    return (
      acc +
      (articleFilter === 'unread' ? stats.total - stats.read : stats.total)
    );
  }, 0);
}

type FeedsProps = {
  user: UserWithFeeds;
  feedStats: FeedStats;
  articleFilter: ArticleFilter;
  onSelect?: () => void;
};

export default function Feeds(props: FeedsProps) {
  const { user, feedStats, onSelect, articleFilter } = props;
  const [expanded, setExpanded] = useState<{ [title: string]: boolean }>({});
  const feeds = getFeedsFromUser(user);
  const selectedFeedIds = useSelectedFeedIds();

  return (
    <ul className="Feeds">
      {user?.feedGroups
        .filter(
          (group) =>
            getArticleCount(
              getFeedsFromGroup(group),
              feedStats,
              articleFilter
            ) > 0
        )
        .map((group) => (
          <li
            key={group.name}
            className={className({
              'Feeds-expanded': expanded[group.name],
            })}
          >
            <div
              className={className('Feeds-group', {
                'Feeds-selected': isSelected(
                  getFeedsFromGroup(group),
                  selectedFeedIds
                ),
              })}
            >
              <span
                className="Feeds-expander"
                onClick={() =>
                  setExpanded({
                    ...expanded,
                    [group.name]: !expanded[group.name],
                  })
                }
              />
              <Link
                className="Feeds-title"
                to={`group-${group.id}`}
                onClick={() => {
                  // setSelectedFeeds(
                  //   getFeedsFromGroup(group).map(({ id }) => id)
                  // );
                  onSelect?.();
                }}
              >
                {group.name}
              </Link>
              {feedStats && (
                <span className="Feeds-unread">
                  {getArticleCount(
                    getFeedsFromGroup(group),
                    feedStats,
                    articleFilter
                  )}
                </span>
              )}
            </div>

            <ul>
              {getFeedsFromGroup(group)
                .filter(
                  (feed) =>
                    getArticleCount([feed], feedStats, articleFilter) > 0
                )
                .map((feed) => (
                  <li
                    className={className('Feeds-feed', {
                      'Feeds-selected': isSelected([feed], selectedFeedIds),
                    })}
                    key={feed.id}
                    onClick={() => {
                      onSelect?.();
                    }}
                  >
                    <Link to={`feed-${feed.id}`} className="Feeds-title">
                      {feeds?.find((f) => f.id === feed.id)?.title}
                    </Link>
                    <div className="Feeds-unread">
                      {(feedStats?.[feed.id].total ?? 0) -
                        (feedStats?.[feed.id].read ?? 0)}
                    </div>
                  </li>
                ))}
            </ul>
          </li>
        ))}
    </ul>
  );
}
