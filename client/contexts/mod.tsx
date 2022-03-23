import React from "react";
import { SelectedFeedsProvider } from "./selectedFeeds.ts";
import { SelectedArticleProvider } from "./selectedArticle.ts";
import { SettingsProvider } from "./settings.ts";

const AppProvider: React.FC = ({ children }) => {
  return (
    <SelectedFeedsProvider>
      <SelectedArticleProvider>
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </SelectedArticleProvider>
    </SelectedFeedsProvider>
  );
};

export default AppProvider;
