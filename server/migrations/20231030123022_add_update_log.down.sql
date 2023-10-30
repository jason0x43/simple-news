DROP TABLE feed_logs;

ALTER TABLE feeds ADD COLUMN last_updated TEXT;
