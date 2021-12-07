export interface AppState {
  userId: number;
  selectedFeeds?: number[];
}

export interface DbArticle {
  id: number;
  feedId: number;
  articleId: string;
  title: string;
  link: string | undefined;
  published: number | undefined;
  content: string | undefined;
}

export interface Article extends DbArticle {
  read?: boolean;
}

export interface Feed {
  id: number;
  url: string;
  title: string;
  type: string;
  lastUpdate: number;
  htmlUrl: string;
  disabled: boolean;
}

export interface UserConfig {
  /** User feeds organized by group */
  feedGroups: {
    /** The title of the group */
    title: string;
    /** An array of Feeds */
    feeds: Feed[];
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

export type UpdateArticleRequest = { articleId: number, read: boolean }[];
