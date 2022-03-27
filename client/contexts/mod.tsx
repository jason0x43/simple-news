import React from "react";
import { SelectedFeedsProvider } from "./selectedFeeds.ts";
import { SelectedArticleProvider } from "./selectedArticle.ts";
import { SettingsProvider } from "./settings.ts";
import { ScrollDataProvider } from "./scrollData.ts";
import type { ScrollData } from "../../types.ts";

export type AppState = {
  selectedFeeds?: number[];
  selectedArticle?: number;
  scrollData?: ScrollData;
};

type AppProviderProps = {
  initialState?: AppState;
};

const AppProvider: React.FC<AppProviderProps> = (
  { children, initialState },
) => {
  return (
    <SettingsProvider>
      <SelectedFeedsProvider initialState={initialState?.selectedFeeds}>
        <SelectedArticleProvider initialState={initialState?.selectedArticle}>
          <ScrollDataProvider initialState={initialState?.scrollData}>
            {children}
          </ScrollDataProvider>
        </SelectedArticleProvider>
      </SelectedFeedsProvider>
    </SettingsProvider>
  );
};

export default AppProvider;
