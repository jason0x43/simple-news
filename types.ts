export interface AppState {
  userId: number;
  selectedFeeds?: number[];
}

export interface Article {
  id: number;
  feedId: number;
  articleId: string;
  title: string;
  link: string | undefined;
  published: number;
  content: string | undefined;
}

export type ArticleHeading = Omit<Article, "content">;

export interface UserArticle {
  articleId: number;
  read: boolean;
  saved: boolean;
}

export interface Feed {
  id: number;
  url: string;
  title: string;
  type: string;
  lastUpdate: number;
  htmlUrl: string;
  disabled: boolean;
  icon: string | null;
}

export interface FeedStats {
  [feedId: number]: {
    total: number;
    read: number;
  };
}

export interface UserConfig {
  /** User feeds organized by group */
  feedGroups: {
    /** The title of the group */
    title: string;
    /** An array of feed ids */
    feeds: number[];
  }[];
}

export interface User {
  /** A unique ID */
  id: number;
  /** The user's name */
  name: string;
  /** The user's email address */
  email: string;
  /** User settings */
  config?: UserConfig;
}

export type UpdateUserArticleRequest = {
  articleId: number;
  read?: boolean;
  saved?: boolean;
}[];

export interface LoginRequest {
  email: string;
  password: string;
}
