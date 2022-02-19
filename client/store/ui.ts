import {
  createAsyncThunk,
  createSelector,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";
import { Article, Article as ArticleRecord } from "../../types.ts";
import { Settings } from "../types.ts";
import { loadValue, storeValue } from "../util.ts";
import {
  loadFeeds,
  selectArticle,
  selectFeeds,
  updateFeeds,
} from "./articles.ts";
import { AppDispatch, AppState } from "./mod.ts";
import { selectUser } from "./user.ts";

export type UiState = {
  selectedArticle: ArticleRecord | undefined;
  selectedFeeds: number[];
  settings: Settings;
  sidebarActive: boolean;
  updating: boolean;
};

export const restoreUiState = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch }
>(
  "ui/restore",
  (_, { dispatch }) => {
    const selectedFeeds = loadValue<number[]>("selectedFeeds");
    const sidebarActive = loadValue<boolean>("sidebarActive");
    const selectedArticle = loadValue<Article>("selectedArticle");

    if (selectedFeeds !== undefined) {
      dispatch(setSelectedFeeds(selectedFeeds));
    }

    if (sidebarActive !== undefined) {
      dispatch(setSidebarActive(sidebarActive));
    }

    if (selectedArticle !== undefined) {
      dispatch(setSelectedArticle(selectedArticle));
    }
  },
);

const initialState: UiState = {
  selectedArticle: undefined,
  selectedFeeds: [],
  settings: { articleFilter: "unread" },
  sidebarActive: false,
  updating: false,
};

console.log("initial state:", initialState);

export const uiSlice = createSlice({
  name: "ui",

  initialState,

  reducers: {
    setSelectedFeeds: (
      state,
      action: PayloadAction<UiState["selectedFeeds"]>,
    ) => {
      state.selectedFeeds = action.payload;
    },

    setSelectedArticle: (
      state,
      action: PayloadAction<UiState["selectedArticle"]>,
    ) => {
      state.selectedArticle = action.payload;
    },

    setSidebarActive: (
      state,
      action: PayloadAction<UiState["sidebarActive"]>,
    ) => {
      state.sidebarActive = action.payload;
    },

    setSettings: (
      state,
      action: PayloadAction<UiState["settings"]>,
    ) => {
      state.settings = action.payload;
    },

    setUpdating: (
      state,
      action: PayloadAction<UiState["updating"]>,
    ) => {
      state.updating = action.payload;
    },

    toggleSidebarActive: (state) => {
      state.sidebarActive = !state.sidebarActive;
    },
  },

  extraReducers: (builder) => {
    builder.addCase(selectArticle.fulfilled, (state, { payload }) => {
      state.selectedArticle = payload;
    });

    builder.addCase(updateFeeds.pending, (state) => {
      state.updating = true;
    });
    builder.addCase(updateFeeds.fulfilled, (state) => {
      state.updating = false;
    });
    builder.addCase(updateFeeds.rejected, (state) => {
      state.updating = false;
    });

    builder.addCase(loadFeeds.pending, (state) => {
      state.sidebarActive = false;
    });
    builder.addCase(loadFeeds.fulfilled, (state, { payload }) => {
      state.selectedFeeds = payload ?? [];
    });
    builder.addCase(loadFeeds.rejected, (state) => {
      state.selectedFeeds = [];
    });
  },
});

export default uiSlice.reducer;

export const {
  setSelectedArticle,
  setSelectedFeeds,
  setSettings,
  setSidebarActive,
  setUpdating,
  toggleSidebarActive,
} = uiSlice.actions;

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

const isDifferent = (
  oldState: AppState,
  newState: AppState,
  selectVal: (state: AppState) => unknown,
) => {
  const oldVal = selectVal(oldState);
  const newVal = selectVal(newState);
  return oldVal !== newVal;
};

export const saveUiState = (oldState: AppState, newState: AppState) => {
  if (isDifferent(oldState, newState, selectSelectedFeeds)) {
    storeValue("selectedFeeds", selectSelectedFeeds(newState));
  }

  if (isDifferent(oldState, newState, selectSidebarActive)) {
    storeValue("sidebarActive", selectSidebarActive(newState));
  }

  if (isDifferent(oldState, newState, selectSelectedArticle)) {
    storeValue("selectedArticle", selectSelectedArticle(newState));
  }
};
