import { React, useEffect, useMemo, useState } from "../deps.ts";
import { className } from "../util.ts";
import useUser from "../hooks/useUser.ts";
import useFeedStats from "../hooks/useFeedStats.ts";
import { Feed, FeedStats, UserConfig } from "../../types.ts";

export interface FeedsProps {
  selectedFeeds?: number[];
  onSelectFeeds?: (feeds: number[]) => void;
}

function isSelected(feeds: Feed[], selected: number[] | undefined) {
  if (!selected) {
    return false;
  }
  return feeds.every((feed) => selected.includes(feed.id));
}

function getGroupUnread(
  feeds: UserConfig["feedGroups"][0]["feeds"],
  feedStats: FeedStats,
) {
  return feeds.reduce((acc, feed) => {
    const stats = feedStats[feed.id];
    return acc + (stats.total - stats.read);
  }, 0);
}

const Feeds: React.FC<FeedsProps> = (props) => {
  const [expanded, setExpanded] = useState<{ [title: string]: boolean }>({});
  const { feedStats, fetchFeedStats } = useFeedStats();
  const { onSelectFeeds, selectedFeeds } = props;
  const { user } = useUser();

  useEffect(() => {
    if (user && !feedStats) {
      fetchFeedStats();
    }
  }, [feedStats, user]);

  return (
    <ul className="Feeds">
      {user?.config?.feedGroups.map((group) => (
        <li
          key={group.title}
          className={className({
            "Feeds-expanded": expanded[group.title],
          })}
        >
          <div
            className={className(
              "Feeds-group",
              { "Feeds-selected": isSelected(group.feeds, selectedFeeds) },
            )}
          >
            <span
              className="Feeds-expander"
              onClick={() =>
                setExpanded({
                  ...expanded,
                  [group.title]: !expanded[group.title],
                })}
            />
            <span
              className="Feeds-title"
              onClick={() => onSelectFeeds?.(group.feeds.map(({ id }) => id))}
            >
              {group.title}
            </span>
            {feedStats && (
              <span className="Feeds-unread">
                {getGroupUnread(group.feeds, feedStats)}
              </span>
            )}
          </div>
          <ul>
            {group.feeds.filter((feed) =>
              !feedStats || getGroupUnread([feed], feedStats) > 0
            ).map((feed) => (
              <li
                className={className("Feeds-feed", {
                  "Feeds-selected": isSelected([feed], selectedFeeds),
                })}
                key={feed.id}
                onClick={() => onSelectFeeds?.([feed.id])}
              >
                <div className="Feeds-title">{feed.title}</div>
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
};

export default Feeds;
