import { createCookieContextValue } from "./util.tsx";

const context = createCookieContextValue<
  | number[]
  | undefined
>("selectedFeeds", undefined);
export const SelectedFeedsProvider = context.Provider;
export const useSelectedFeeds = context.useValue;
export const useSelectedFeedsSetter = context.useSetter;
