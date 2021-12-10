import { React, useCallback } from "../deps.ts";
import { FeedStats } from "../../types.ts";
import { getFeedStats } from "../api.ts";

const noop = () => undefined;

const FeedStatsContext = React.createContext<
  {
    feedStats: FeedStats | undefined;
    fetchFeedStats: (feeds?: number[]) => void;
  }
>({ feedStats: undefined, fetchFeedStats: noop });

export default FeedStatsContext;

export interface FeedStatsProviderProps {
  feedStats?: FeedStats;
}

export const FeedStatsProvider: React.FC<FeedStatsProviderProps> = (props) => {
  const [feedStats, setFeedStats] = React.useState<
    | FeedStats
    | undefined
  >(props.feedStats);

  const fetchFeedStats = useCallback(async (feedIds?: number[]) => {
    try {
      setFeedStats(await getFeedStats(feedIds));
    } catch (error) {
      console.error(error);
    }
  }, []);

  return (
    <FeedStatsContext.Provider value={{ feedStats, fetchFeedStats }}>
      {props.children}
    </FeedStatsContext.Provider>
  );
};

