import { React } from "../deps.ts";
import { className } from "../util.ts";
import { Feed, FeedStats, User, UserConfig } from "../../types.ts";
import { Settings } from "../types.ts";

const { useState } = React;

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

export interface FeedsProps {
  settings: Settings;
  user: User;
  feeds: Feed[] | undefined;
  feedStats: FeedStats | undefined;
  selectedFeeds: number[];
  onSelectFeeds: (feedIds: number[]) => void;
}

const Feeds: React.FC<FeedsProps> = (props) => {
  const { settings, user, feeds, feedStats, selectedFeeds, onSelectFeeds } =
    props;
  const [expanded, setExpanded] = useState<{ [title: string]: boolean }>({});

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
              onClick={() => onSelectFeeds(group.feeds)}
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
                onClick={() => onSelectFeeds([feed])}
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
