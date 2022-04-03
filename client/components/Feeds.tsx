import React, { useState } from "react";
import { className } from "../util.ts";
import type { FeedStats, UserConfig } from "../../types.ts";
import type { Settings } from "../types.ts";
import { useFeeds, useFeedStats, useUser } from "../queries/mod.ts";

function isSelected(feedIds: number[], selected: number[] | undefined) {
  if (!selected) {
    return false;
  }
  return feedIds.every((id) => selected.includes(id));
}

const getArticleCount = (
  feeds: UserConfig["feedGroups"][0]["feeds"],
  feedStats: FeedStats,
  settings: Settings,
) =>
  feeds.reduce((acc, feed) => {
    const stats = feedStats[feed];
    return acc + (settings.articleFilter === "unread"
      ? (stats.total - stats.read)
      : stats.total);
  }, 0);

type FeedsProps = {
  selectedFeeds: number[] | undefined;
  settings: Settings;
  onSelect: (feeds: number[] | undefined) => void;
};

const Feeds: React.VFC<FeedsProps> = (props) => {
  const { onSelect, settings, selectedFeeds } = props;
  const [expanded, setExpanded] = useState<{ [title: string]: boolean }>({});
  const { data: user } = useUser();
  const { data: feeds } = useFeeds();
  const { data: feedStats } = useFeedStats();

  return (
    <ul className="Feeds">
      {user?.config?.feedGroups.filter((group) =>
        !feedStats || getArticleCount(group.feeds, feedStats, settings) > 0
      ).map((group) => (
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
              onClick={() => onSelect(group.feeds)}
            >
              {group.title}
            </span>
            {feedStats && (
              <span className="Feeds-unread">
                {getArticleCount(group.feeds, feedStats, settings)}
              </span>
            )}
          </div>

          <ul>
            {group.feeds.filter((feed) =>
              !feedStats || getArticleCount([feed], feedStats, settings) > 0
            ).map((feed) => (
              <li
                className={className("Feeds-feed", {
                  "Feeds-selected": isSelected([feed], selectedFeeds),
                })}
                key={feed}
                onClick={() => onSelect([feed])}
              >
                <div className="Feeds-title">
                  {feeds?.find((f) => f.id === feed)?.title}
                </div>
                <div className="Feeds-unread">
                  {(feedStats?.[feed].total ?? 0) -
                    (feedStats?.[feed].read ?? 0)}
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
