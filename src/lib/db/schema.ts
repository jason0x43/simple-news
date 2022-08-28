export const version = 1;

export type Article = {
  id: string;
  articleId: string;
  feedId: string;
  title?: string | null;
  link?: string | null;
  published: number;
  content?: string | null;
};

export type Feed = {
  id: string;
  url: string;
  title: string;
  type: string;
  lastUpdate: number;
  disabled?: 0 | 1 | null;
  icon?: string | null;
  htmlUrl?: string | null;
};

export type FeedGroup = {
  id: string;
  userId: User['id'];
  name: string;
};

export type FeedGroupFeed = {
  feedGroupId: FeedGroup['id'];
  feedId: Feed['id'];
};

export type User = {
  id: string;
  email: string;
  username: string;
  config?: string | null;
};

export type UserArticle = {
  userId: User['id'];
  articleId: Article['id'];
  read?: 0 | 1 | null;
  saved?: 0 | 1 | null;
};

export type Password = {
  hash: string;
  userId: User['id'];
};

export type Session = {
  id: string;
  data: string;
  expires: number;
  userId: User['id'];
};
