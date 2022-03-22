import React from "react";
import { SelectedFeedsProvider } from "./selectedFeeds.ts";
import { SelectedArticleProvider } from "./selectedArticle.ts";
import { UpdatedArticlesProvider } from "./updatedArticles.ts";
import { SettingsProvider } from "./settings.ts";

const AppProvider: React.FC = ({ children }) => {
  return (
    <SelectedFeedsProvider>
      <SelectedArticleProvider>
        <UpdatedArticlesProvider>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </UpdatedArticlesProvider>
      </SelectedArticleProvider>
    </SelectedFeedsProvider>
  );
};

export default AppProvider;
