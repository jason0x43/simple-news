import { Settings } from "./types.ts";
import {
  Article as ArticleRecord,
  ArticleHeading,
  Feed,
  FeedStats,
  User,
  UserArticle,
} from "../types.ts";
import { toObject } from "./util.ts";

export type AppState = {
  settings: Settings;
  sidebarActive: boolean;
  updating: boolean;
  feeds: Feed[] | undefined;
  articles: ArticleHeading[];
  feedStats: FeedStats | undefined;
  userArticles: { [articleId: number]: UserArticle };
  selectedFeeds: number[];
  selectedArticle: ArticleRecord | undefined;
  user: User;
};

type InitProps = {
  user: User;
  feeds?: Feed[];
  feedStats?: FeedStats;
  articles?: ArticleHeading[];
  userArticles?: UserArticle[];
  selectedFeeds?: number[];
  selectedArticle?: ArticleRecord;
};

export function initState(props: InitProps): AppState {
  return {
    settings: { articleFilter: "unread" },
    feeds: props.feeds,
    sidebarActive: false,
    updating: false,
    articles: props.articles ?? [],
    feedStats: props.feedStats,
    userArticles: props.userArticles
      ? toObject(props.userArticles, "articleId")
      : {},
    selectedFeeds: props.selectedFeeds ?? [],
    selectedArticle: props.selectedArticle,
    user: props.user,
  };
}

type AppStateAction =
  | { type: "setSettings"; payload: Partial<Settings> }
  | { type: "setArticles"; payload: ArticleHeading[] }
  | { type: "setSelectedArticle"; payload: ArticleRecord | undefined }
  | { type: "setUserArticles"; payload: UserArticle[] }
  | { type: "setUserArticlesRead"; payload: { ids: number[]; read: boolean } }
  | { type: "setFeeds"; payload: Feed[] }
  | { type: "setFeedStats"; payload: FeedStats }
  | { type: "setSelectedFeeds"; payload: number[] | undefined }
  | { type: "setSidebarActive"; payload: boolean }
  | { type: "toggleSidebarActive" }
  | { type: "setUpdating"; payload: boolean };

export function updateState(state: AppState, action: AppStateAction): AppState {
  switch (action.type) {
    case "setSettings":
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };
    case "setFeeds":
      return {
        ...state,
        feeds: action.payload,
      };
    case "setSidebarActive":
      return {
        ...state,
        sidebarActive: action.payload,
      };
    case "toggleSidebarActive":
      return {
        ...state,
        sidebarActive: !state.sidebarActive,
      };
    case "setArticles":
      return {
        ...state,
        articles: action.payload,
      };
    case "setSelectedArticle":
      return {
        ...state,
        selectedArticle: action.payload,
      };
    case "setFeedStats":
      return {
        ...state,
        feedStats: action.payload,
      };
    case "setSelectedFeeds":
      return {
        ...state,
        selectedFeeds: action.payload ?? [],
      };
    case "setUpdating":
      return {
        ...state,
        updating: action.payload,
      };
    case "setUserArticles":
      return {
        ...state,
        userArticles: toObject(action.payload, "articleId"),
      };
    case "setUserArticlesRead": {
      const newUserArticles = { ...state.userArticles };
      for (const id of action.payload.ids) {
        newUserArticles[id] = {
          ...newUserArticles[id],
          read: action.payload.read,
        };
      }
      return { ...state, userArticles: newUserArticles };
    }
  }
}
