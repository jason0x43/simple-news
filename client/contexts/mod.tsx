import React from "react";
import { SelectedFeedsProvider } from "./selectedFeeds.ts";
import { SelectedArticleProvider } from "./selectedArticle.ts";
import { SettingsProvider } from "./settings.ts";

export type AppState = {
  selectedFeeds?: number[];
  selectedArticle?: number;
};

type AppProviderProps = {
  initialState?: AppState;
};

const AppProvider: React.FC<AppProviderProps> = (
  { children, initialState },
) => {
  return (
    <SelectedFeedsProvider initialState={initialState?.selectedFeeds}>
      <SelectedArticleProvider initialState={initialState?.selectedArticle}>
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </SelectedArticleProvider>
    </SelectedFeedsProvider>
  );
};

export default AppProvider;
