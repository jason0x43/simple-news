export type AppState = {
  userId: number;
  selectedFeeds?: number[];
  selectedArticle?: number;
  sockets?: Set<WebSocket>;
};

export type Session = {
  id: number;
  sessionId: string;
  userId: number;
  expires: number;
}
