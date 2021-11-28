import { React } from "./deps.ts";
import useUser from "./hooks/useUser.ts";

export interface FeedsProps {
  selectedFeeds?: number[];
  onSelectFeeds?: (feeds: number[]) => void;
}

const Feeds: React.FC<FeedsProps> = (props) => {
  const { onSelectFeeds } = props;
  const { user } = useUser();

  return (
    <ul className="Feeds">
      {user?.config?.feedGroups.map((group) => (
        <li key={group.title}>
          <div className="Feeds-group">{group.title}</div>
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
