import { React, useContext, useMemo } from "../deps.ts";

const FeedsContext = React.createContext<
  { selectedFeeds: number[]; setSelectedFeeds: (feedIds: number[]) => void }
>({ selectedFeeds: [], setSelectedFeeds: () => undefined });

export default FeedsContext;

export interface FeedsProviderProps {
  selectedFeeds?: number[] | undefined;
}

export const FeedsProvider: React.FC<FeedsProviderProps> = (props) => {
  const [selectedFeeds, setSelectedFeeds] = React.useState<number[]>(
    props.selectedFeeds ?? [],
  );

  const value = useMemo(() => ({ selectedFeeds, setSelectedFeeds }), [
    selectedFeeds,
  ]);

  return (
    <FeedsContext.Provider value={value}>
      {props.children}
    </FeedsContext.Provider>
  );
};

export function useFeeds() {
  return useContext(FeedsContext);
}
