export type ArticleFilter = "unread" | "all" | "saved";

export interface Settings {
  articleFilter: ArticleFilter;
}
