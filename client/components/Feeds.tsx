import React, { useState } from "react";
import { className } from "../util.ts";
import { FeedStats, UserConfig } from "../../types.ts";
import { Settings } from "../types.ts";
import { useAppDispatch, useAppSelector } from "../store/mod.ts";
import { selectUser } from "../store/userSelectors.ts";
import { selectSelectedFeeds, selectSettings } from "../store/uiSelectors.ts";
import { loadFeeds } from "../store/articles.ts";
import { selectFeeds, selectFeedStats } from "../store/articlesSelectors.ts";

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

const Feeds: React.FC = () => {
  const [expanded, setExpanded] = useState<{ [title: string]: boolean }>({});
  const user = useAppSelector(selectUser);
  const settings = useAppSelector(selectSettings);
  const feeds = useAppSelector(selectFeeds);
  const feedStats = useAppSelector(selectFeedStats);
  const selectedFeeds = useAppSelector(selectSelectedFeeds);
  const dispatch = useAppDispatch();

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
              onClick={() => dispatch(loadFeeds(group.feeds))}
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
                onClick={() => dispatch(loadFeeds([feed]))}
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
