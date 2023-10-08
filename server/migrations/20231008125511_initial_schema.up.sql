CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  config JSON
);

CREATE TABLE passwords (
  id UUID PRIMARY KEY,
  hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id)
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  data JSON NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE feeds (
  id UUID PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'rss',
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL,
  disabled BOOLEAN,
  icon TEXT,
  html_url TEXT
);

CREATE TABLE articles (
  id UUID PRIMARY KEY,
  article_id TEXT NOT NULL,
  feed_id UUID NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
  title TEXT,
  link TEXT,
  published TIMESTAMP WITH TIME ZONE NOT NULL,
  content TEXT,
  UNIQUE (feed_id, article_id)
);

CREATE TABLE user_articles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  read BOOLEAN,
  saved BOOLEAN,
  UNIQUE (user_id, article_id)
);

CREATE TABLE feed_groups (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id, name)
);

CREATE TABLE feed_group_feed (
  id UUID PRIMARY KEY,
  feed_group_id UUID NOT NULL REFERENCES feed_groups(id) ON DELETE CASCADE,
  feed_id UUID NOT NULL REFERENCES feeds(id) ON DELETE CASCADE
);
