import { createPersistedContextValue } from "./util.tsx";

const context = createPersistedContextValue<
  | number[]
  | undefined
>("selectedFeeds", undefined);
export const SelectedFeedsProvider = context.Provider;
export const useSelectedFeeds = context.useValue;
export const useSelectedFeedsSetter = context.useSetter;
