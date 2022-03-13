export type AppState = {
  userId: number;
  selectedFeeds?: number[];
  selectedArticle?: number;
};

export type Article = {
  id: number;
  feedId: number;
  articleId: string;
  title: string;
  link: string | undefined;
  published: number;
  content: string | undefined;
};

export type ArticleHeading = Omit<Article, "content">;

export type UserArticle = {
  articleId: number;
  read: boolean;
  saved: boolean;
};

export type Feed = {
  id: number;
  url: string;
  title: string;
  type: string;
  lastUpdate: number;
  htmlUrl: string;
  disabled: boolean;
  icon: string | null;
};

export type FeedStats = {
  [feedId: number]: {
    total: number;
    read: number;
  };
};

export type UserConfig = {
  /** User feeds organized by group */
  feedGroups: {
    /** The title of the group */
    title: string;
    /** An array of feed ids */
    feeds: number[];
  }[];
};

export type User = {
  /** A unique ID */
  id: number;
  /** The user's username */
  username: string;
  /** The user's email address */
  email: string;
  /** User settings */
  config?: UserConfig;
};

export type UpdateUserArticleRequest = {
  articleId: number;
  read?: boolean;
  saved?: boolean;
  isSelected?: boolean;
}[];

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  user: User;
  feeds: Feed[];
  feedStats: FeedStats;
};
