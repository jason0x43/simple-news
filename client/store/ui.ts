import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { Article } from "../../types.ts";
import type { Settings } from "../types.ts";
import { loadValue, storeValue } from "../util.ts";
import {
  loadFeeds,
  selectArticle,
  setArticlesRead,
  updateFeeds,
} from "./articles.ts";
import type { AppDispatch, AppState } from "./mod.ts";
import {
  selectSelectedArticle,
  selectSidebarActive,
} from "./uiSelectors.ts";
import { signin } from "./user.ts";

export type UiState = {
  selectedArticle: Article | undefined;
  settings: Settings;
  sidebarActive: boolean;
  updating: boolean;
  updatedArticles: number[];
};

export const restoreUiState = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch }
>(
  "ui/restore",
  (_, { dispatch }) => {
    const sidebarActive = loadValue<boolean>("sidebarActive");
    const selectedArticle = loadValue<Article>("selectedArticle");

    if (sidebarActive !== undefined) {
      dispatch(setSidebarActive(sidebarActive));
    }

    if (selectedArticle !== undefined) {
      dispatch(setSelectedArticle(selectedArticle));
      dispatch(addUpdatedArticle(selectedArticle.id));
    }
  },
);

const initialState: UiState = {
  selectedArticle: undefined,
  settings: { articleFilter: "unread" },
  sidebarActive: false,
  updating: false,
  updatedArticles: [],
};

export const uiSlice = createSlice({
  name: "ui",

  initialState,

  reducers: {
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

    addUpdatedArticle: (state, action: PayloadAction<number>) => {
      state.updatedArticles = [
        ...state.updatedArticles,
        action.payload,
      ];
    },
  },

  extraReducers: (builder) => {
    builder.addCase(signin.fulfilled, (state) => {
      state.sidebarActive = true;
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

    builder.addCase(selectArticle.fulfilled, (state, { payload }) => {
      state.selectedArticle = payload;
      if (payload) {
        state.updatedArticles = [
          ...state.updatedArticles,
          payload.id,
        ];
      }
    });

    builder.addCase(setArticlesRead.fulfilled, (state, { payload }) => {
      if (payload) {
        state.updatedArticles = [
          ...state.updatedArticles,
          ...payload,
        ];
      }
    });
  },
});

export default uiSlice.reducer;

const { addUpdatedArticle } = uiSlice.actions;

export const {
  setSelectedArticle,
  setSettings,
  setSidebarActive,
  setUpdating,
  toggleSidebarActive,
} = uiSlice.actions;

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
  if (isDifferent(oldState, newState, selectSidebarActive)) {
    storeValue("sidebarActive", selectSidebarActive(newState));
  }

  if (isDifferent(oldState, newState, selectSelectedArticle)) {
    storeValue("selectedArticle", selectSelectedArticle(newState));
  }
};
