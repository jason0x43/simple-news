import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type {
  Article,
  ArticleHeading,
  Feed,
  FeedStats,
  UserArticle,
} from "../../types.ts";
import {
  getArticle,
  getArticleHeadings,
  getFeeds,
  getFeedStats,
  getUserArticles,
  isResponseError,
  refreshFeeds,
  setRead,
} from "../api.ts";
import type { AppDispatch, AppState } from "./mod.ts";
import { selectSelectedFeeds } from "./uiSelectors.ts";

export type ArticlesState = {
  feeds: Feed[] | undefined;
  articles: ArticleHeading[];
  feedStats: FeedStats | undefined;
  userArticles: { [articleId: string]: UserArticle };
};

const shouldLogout = (error: Error) =>
  isResponseError(error) && error.status === 403;

const logout = () => {
  location.href = "/login";
};

// Fetch updated data for the current selected feeds and update the app state
export const loadArticles = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch; state: AppState }
>(
  "articles/load",
  async (_, { dispatch, getState }) => {
    const selectedFeeds = selectSelectedFeeds(getState());

    try {
      const [feedStats, articles, userArticles] = await Promise.all([
        getFeedStats(),
        getArticleHeadings(selectedFeeds),
        getUserArticles(selectedFeeds),
      ]);

      dispatch(setFeedStats(feedStats));
      dispatch(setArticles(articles));
      dispatch(setUserArticles(userArticles));
    } catch (error) {
      if (shouldLogout(error)) {
        logout();
      } else {
        throw new Error(`Error during periodic update: ${error.message}`);
      }
    }
  },
);

export const loadFeeds = createAsyncThunk<
  number[] | undefined,
  number[],
  { dispatch: AppDispatch }
>(
  "articles/loadFeeds",
  async (feedIds, { dispatch }) => {
    console.log("loading feeds", feedIds);
    try {
      const [articles, userArticles, feeds] = await Promise.all([
        getArticleHeadings(feedIds),
        getUserArticles(feedIds),
        getFeeds(feedIds),
      ]);

      dispatch(setArticles(articles));
      dispatch(setUserArticles(userArticles));
      dispatch(setFeeds(feeds));

      return feedIds;
    } catch (error) {
      if (shouldLogout(error)) {
        logout();
      } else {
        throw new Error(`Error while selecting feeds: ${error.message}`);
      }
    }
  },
);

export const updateFeeds = createAsyncThunk<
  void,
  void,
  { state: AppState; dispatch: AppDispatch }
>(
  "articles/updateFeeds",
  async (_, { getState, dispatch }) => {
    try {
      await refreshFeeds();

      const selectedFeeds = selectSelectedFeeds(getState());
      if (selectedFeeds) {
        const [feedStats, articles] = await Promise.all([
          getFeedStats(),
          getArticleHeadings(selectedFeeds),
        ]);
        dispatch(setFeedStats(feedStats));
        dispatch(setArticles(articles));
      } else {
        const feedStats = await getFeedStats();
        dispatch(setFeedStats(feedStats));
      }
    } catch (error) {
      if (shouldLogout(error)) {
        logout();
      } else {
        throw new Error(`Error updating feeds: ${error.message}`);
      }
    }
  },
);

export const setArticlesRead = createAsyncThunk<
  void,
  { articleIds: number[]; read: boolean },
  { dispatch: AppDispatch }
>(
  "articles/setArticlesRead",
  async ({ articleIds, read }, { dispatch }) => {
    try {
      await setRead(articleIds, read);
      const feedStats = await getFeedStats();
      dispatch(setUserArticlesRead({ ids: articleIds, read }));
      dispatch(setFeedStats(feedStats));
    } catch (error) {
      if (shouldLogout(error)) {
        logout();
      } else {
        console.warn(`Error settings articles read: ${error.message}`);
      }
    }
  },
);

export const selectArticle = createAsyncThunk<
  Article | undefined,
  number | undefined,
  { dispatch: AppDispatch }
>(
  "articles/selectArticle",
  async (articleId, { dispatch }) => {
    if (articleId) {
      try {
        const article = await getArticle(articleId);
        dispatch(setArticlesRead({ articleIds: [articleId], read: true }));
        return article;
      } catch (error) {
        if (shouldLogout(error)) {
          logout();
        } else {
          console.warn(`Error getting article: ${error.message}`);
        }
      }
    }
  },
);

const initialState: ArticlesState = {
  feeds: undefined,
  articles: [],
  feedStats: undefined,
  userArticles: {},
};

export const articlesSlice = createSlice({
  name: "articles",

  initialState,

  reducers: {
    setFeeds: (
      state,
      action: PayloadAction<ArticlesState["feeds"]>,
    ) => {
      state.feeds = action.payload;
    },

    setArticles: (
      state,
      action: PayloadAction<ArticlesState["articles"]>,
    ) => {
      state.articles = action.payload;
    },

    setFeedStats: (
      state,
      action: PayloadAction<ArticlesState["feedStats"]>,
    ) => {
      state.feedStats = action.payload;
    },

    setUserArticles: (
      state,
      action: PayloadAction<ArticlesState["userArticles"]>,
    ) => {
      state.userArticles = action.payload;
    },

    setUserArticlesRead: (
      state,
      action: PayloadAction<{ ids: number[]; read: boolean }>,
    ) => {
      const newUserArticles = { ...state.userArticles };
      for (const id of action.payload.ids) {
        newUserArticles[id] = {
          ...newUserArticles[id],
          read: action.payload.read,
        };
      }
      return { ...state, userArticles: newUserArticles };
    },
  },
});

export default articlesSlice.reducer;

const {
  setFeeds,
  setArticles,
  setFeedStats,
  setUserArticles,
  setUserArticlesRead,
} = articlesSlice.actions;
