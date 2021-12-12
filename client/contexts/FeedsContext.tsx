import { React, useContext, useMemo } from "../deps.ts";
import { User } from "../../types.ts";
import { useUser } from "./UserContext.tsx";

const FeedsContext = React.createContext<
  {
    selectedFeeds: number[];
    setSelectedFeeds: (feedIds: number[]) => void;
    feedsTitle: string | undefined;
  }
>({
  selectedFeeds: [],
  setSelectedFeeds: () => undefined,
  feedsTitle: undefined,
});

export default FeedsContext;

export interface FeedsProviderProps {
  selectedFeeds?: number[] | undefined;
}

function getFeedsTitle(selectedFeeds: number[], user: User | undefined) {
  if (selectedFeeds.length === 0) {
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
  const [selectedFeeds, setSelectedFeeds] = React.useState<number[]>(
    props.selectedFeeds ?? [],
  );
  const { user } = useUser();

  const value = useMemo(() => {
    const feedsTitle = getFeedsTitle(selectedFeeds, user);
    return { selectedFeeds, setSelectedFeeds, feedsTitle };
  }, [selectedFeeds, user?.config]);

  return (
    <FeedsContext.Provider value={value}>
      {props.children}
    </FeedsContext.Provider>
  );
};

export function useFeeds() {
  return useContext(FeedsContext);
}
