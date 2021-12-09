import { React, useState } from "../deps.ts";
import { className } from "../util.ts";
import useUser from "../hooks/useUser.ts";
import { Feed } from "../../types.ts";

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

const Feeds: React.FC<FeedsProps> = (props) => {
  const [expanded, setExpanded] = useState<{ [title: string]: boolean }>({});
  const { onSelectFeeds, selectedFeeds } = props;
  const { user } = useUser();

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
          </div>
          <ul>
            {group.feeds.map((feed) => (
              <li
                className={className("Feeds-feed", {
                  "Feeds-selected": isSelected([feed], selectedFeeds),
                })}
                key={feed.id}
                onClick={() => onSelectFeeds?.([feed.id])}
              >
                {feed.title}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
};

export default Feeds;
