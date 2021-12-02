import { React, useState } from './deps.ts';
import { className } from './util.ts';
import useUser from './hooks/useUser.ts';

export interface FeedsProps {
  selectedFeeds?: number[];
  onSelectFeeds?: (feeds: number[]) => void;
}

const Feeds: React.FC<FeedsProps> = (props) => {
  const [expanded, setExpanded] = useState<{ [title: string]: boolean }>({});
  const { onSelectFeeds } = props;
  const { user } = useUser();

  return (
    <ul className="Feeds">
      {user?.config?.feedGroups.map((group) => (
        <li
          key={group.title}
          className={className({
            'Feeds-expanded': expanded[group.title],
          })}
        >
          <div className="Feeds-group">
            <span
              className="Feeds-expander"
              onClick={() =>
                setExpanded({
                  ...expanded,
                  [group.title]: !expanded[group.title],
                })
              }
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
                className="Feeds-feed"
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
