import type { AppState } from "./mod.ts";

export const selectFeeds = (state: AppState) => state.articles.feeds;
export const selectArticles = (state: AppState) => state.articles.articles;
export const selectFeedStats = (state: AppState) => state.articles.feedStats;
export const selectSelectedFeeds = (state: AppState) =>
  state.articles.selectedFeeds;
export const selectUserArticles = (state: AppState) =>
  state.articles.userArticles;
