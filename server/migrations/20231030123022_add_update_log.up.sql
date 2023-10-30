CREATE TABLE feed_logs (
  id BLOB PRIMARY KEY,
  feed_id BLOB NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
  time TEXT NOT NULL,
  success INTEGER NOT NULL,
  message TEXT
) STRICT;

ALTER TABLE feeds DROP COLUMN last_updated;
