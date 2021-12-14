import { React, useCallback, useState } from "../deps.ts";
import { className } from "../util.ts";
import {
  Settings,
  useArticles,
  useFeeds,
  useSettings,
  useUser,
} from "../contexts/mod.tsx";
import { Feed, FeedStats, UserConfig } from "../../types.ts";

function isSelected(feeds: Feed[], selected: number[] | undefined) {
  if (!selected) {
    return false;
  }
  return feeds.every((feed) => selected.includes(feed.id));
}

const getArticleCount = (
  feeds: UserConfig["feedGroups"][0]["feeds"],
  feedStats: FeedStats,
  settings: Settings,
) =>
  feeds.reduce((acc, feed) => {
    const stats = feedStats[feed.id];
    return acc + (settings.articleFilter === "unread"
      ? (stats.total - stats.read)
      : stats.total);
  }, 0);

const Feeds: React.FC = () => {
  const [expanded, setExpanded] = useState<{ [title: string]: boolean }>({});
  const { user } = useUser();
  const { feedStats, selectedFeeds, setSelectedFeeds } = useFeeds();
  const { fetchArticles } = useArticles();
  const { settings } = useSettings();

  const selectFeeds = useCallback((feedIds: number[]) => {
    setSelectedFeeds(feedIds);
    fetchArticles(feedIds);
  }, []);

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
              onClick={() => selectFeeds(group.feeds.map(({ id }) => id))}
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
                key={feed.id}
                onClick={() => selectFeeds([feed.id])}
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
