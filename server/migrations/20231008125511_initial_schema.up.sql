CREATE TABLE users (
  id BLOB PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  config TEXT
) STRICT;

CREATE TABLE passwords (
  id BLOB PRIMARY KEY,
  hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  user_id BLOB NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id)
) STRICT;

CREATE TABLE sessions (
  id BLOB PRIMARY KEY,
  data TEXT NOT NULL,
  expires INTEGER NOT NULL,
  user_id BLOB NOT NULL REFERENCES users(id) ON DELETE CASCADE
) STRICT;

CREATE TABLE feeds (
  id BLOB PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'rss',
  last_updated INTEGER NOT NULL,
  disabled INTEGER NOT NULL,
  icon TEXT,
  html_url TEXT
) STRICT;

CREATE TABLE articles (
  id BLOB PRIMARY KEY,
  article_id BLOB NOT NULL,
  feed_id BLOB NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
  title TEXT,
  link TEXT,
  published INTEGER NOT NULL,
  content TEXT,
  UNIQUE (feed_id, article_id)
) STRICT;

CREATE TABLE user_articles (
  id BLOB PRIMARY KEY,
  user_id BLOB NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_id BLOB NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  read INTEGER,
  saved INTEGER,
  UNIQUE (user_id, article_id)
) STRICT;

CREATE TABLE feed_groups (
  id BLOB PRIMARY KEY,
  name TEXT NOT NULL,
  user_id BLOB NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id, name)
) STRICT;

CREATE TABLE feed_group_feed (
  id BLOB PRIMARY KEY,
  feed_group_id BLOB NOT NULL REFERENCES feed_groups(id) ON DELETE CASCADE,
  feed_id BLOB NOT NULL REFERENCES feeds(id) ON DELETE CASCADE
) STRICT;
