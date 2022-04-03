import { ScrollData } from "../types.ts";

export type AppState = {
  selectedFeeds?: number[];
  selectedArticle?: number;
  scrollData?: ScrollData;
};

export type ArticleFilter = "unread" | "all" | "saved";

export type Settings = {
  articleFilter: ArticleFilter;
};
