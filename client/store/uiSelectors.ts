import type { AppState } from './mod.ts';
import { createSelector } from '@reduxjs/toolkit';
import { selectUser } from './userSelectors.ts';
import { selectFeeds } from './articlesSelectors.ts';

export const selectSelectedArticle = (state: AppState) =>
  state.ui.selectedArticle;
export const selectSelectedFeeds = (state: AppState) => state.ui.selectedFeeds;
export const selectSettings = (state: AppState) => state.ui.settings;
export const selectSidebarActive = (state: AppState) => state.ui.sidebarActive;
export const selectUpdating = (state: AppState) => state.ui.updating;

export const selectFeedsTitle = createSelector(
  selectUser,
  selectFeeds,
  selectSelectedFeeds,
  (user, feeds, selectedFeeds) => {
    if (
      !selectedFeeds || selectedFeeds.length === 0 || !feeds ||
      !user?.config?.feedGroups
    ) {
      return undefined;
    }

    if (selectedFeeds.length === 1) {
      for (const feed of feeds) {
        if (feed.id === selectedFeeds[0]) {
          return feed.title;
        }
      }
    } else if (selectedFeeds.length > 1) {
      for (const group of user?.config?.feedGroups) {
        for (const feed of group.feeds) {
          if (feed === selectedFeeds[0]) {
            return group.title;
          }
        }
      }
    }

    return undefined;
  },
);
