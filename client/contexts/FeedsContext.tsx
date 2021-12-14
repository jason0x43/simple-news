import { React, useContext, useMemo, useState } from "../deps.ts";
import { Feed, FeedStats, User } from "../../types.ts";
import { useUser } from "./UserContext.tsx";
import { useArticles } from "./ArticlesContext.tsx";
import { getFeeds, getFeedStats } from "../api.ts";

const FeedsContext = React.createContext<
  {
    selectedFeeds: number[] | undefined;
    setSelectedFeeds: (feedIds: number[]) => void;
    feedsTitle: string | undefined;
    fetchFeeds: () => void;
    feeds: Feed[] | undefined;
    feedStats: FeedStats | undefined;
    fetchFeedStats: (feeds?: number[]) => void;
  }
>({
  selectedFeeds: undefined,
  setSelectedFeeds: () => undefined,
  feedsTitle: undefined,
  fetchFeeds: () => undefined,
  feeds: undefined,
  feedStats: undefined,
  fetchFeedStats: () => undefined,
});

export default FeedsContext;

export interface FeedsProviderProps {
  selectedFeeds?: number[] | undefined;
  feedStats?: FeedStats;
  feeds?: Feed[] | undefined;
}

function getFeedsTitle(
  selectedFeeds: number[] | undefined,
  user: User | undefined,
) {
  if (!selectedFeeds || selectedFeeds.length === 0) {
    return undefined;
  }
  const feedGroups = user?.config?.feedGroups;

  if (!feedGroups) {
    return undefined;
  }

  if (selectedFeeds.length === 1) {
    for (const group of feedGroups) {
      for (const feed of group.feeds) {
        if (feed.id === selectedFeeds[0]) {
          return feed.title;
        }
      }
    }
  } else if (selectedFeeds.length > 1) {
    for (const group of feedGroups) {
      for (const feed of group.feeds) {
        if (feed.id === selectedFeeds[0]) {
          return group.title;
        }
      }
    }
  }

  return undefined;
}

export const FeedsProvider: React.FC<FeedsProviderProps> = (props) => {
  const [selectedFeeds, setSelectedFeeds] = useState(props.selectedFeeds);
  const [feeds, setFeeds] = useState(props.feeds);
  const [feedStats, setFeedStats] = useState(props.feedStats);
  const { user } = useUser();
  const { fetchArticles } = useArticles();

  const value = useMemo(() => {
    const feedsTitle = getFeedsTitle(selectedFeeds, user);
    return {
      feeds,
      feedStats,
      feedsTitle,
      selectedFeeds,

      setSelectedFeeds: (feedIds: number[]) => {
        setSelectedFeeds(feedIds);
        fetchArticles(feedIds);
      },

      fetchFeeds: async () => {
        const feeds = await getFeeds();
        setFeeds(feeds);
      },

      fetchFeedStats: (async (feedIds?: number[]) => {
        try {
          setFeedStats(await getFeedStats(feedIds));
        } catch (error) {
          console.error(error);
        }
      }),
    };
  }, [feeds, selectedFeeds, user?.config]);

  return (
    <FeedsContext.Provider value={value}>
      {props.children}
    </FeedsContext.Provider>
  );
};

export function useFeeds() {
  return useContext(FeedsContext);
}
