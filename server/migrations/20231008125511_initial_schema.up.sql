CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  config JSONB
);

CREATE TABLE passwords (
  id TEXT PRIMARY KEY,
  hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id)
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE feeds (
  id TEXT PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'rss',
  disabled BOOLEAN NOT NULL,
  icon TEXT,
  html_url TEXT
);

CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  feed_id TEXT NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  published TIMESTAMPTZ NOT NULL,
  link TEXT,
  UNIQUE (feed_id, article_id)
);

CREATE TABLE user_articles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  saved BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (user_id, article_id)
);

CREATE TABLE feed_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id, name)
);

CREATE TABLE feed_group_feeds (
  feed_group_id TEXT NOT NULL REFERENCES feed_groups(id) ON DELETE CASCADE,
  feed_id TEXT NOT NULL REFERENCES feeds(id) ON DELETE CASCADE
);

CREATE TABLE feed_logs (
  id TEXT PRIMARY KEY,
  feed_id TEXT NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
  time TIMESTAMPTZ NOT NULL,
  success BOOLEAN NOT NULL,
  message TEXT
);
