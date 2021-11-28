import { log } from "../deps.ts";
import { query } from "./db.ts";
import { Feed } from "../../types.ts";

type FeedRow = [number, string, string, string, number, string, boolean];

function rowToFeed(row: FeedRow): Feed {
  const [id, url, title, type, lastUpdate, htmlUrl, disabled] = row;
  return { id, url, title, type, lastUpdate, htmlUrl, disabled };
}

export function addFeed(
  feed: Omit<Feed, "id" | "lastUpdate" | "disabled">,
): Feed {
  log.debug(`Adding feed ${JSON.stringify(feed)}`);
  const rows = query<FeedRow>(
    `INSERT INTO feeds (url, title, type)
    VALUES (:url, :title, :type)
    RETURNING *`,
    feed,
  );
  return rowToFeed(rows[0]);
}

export function getFeed(id: number): Feed {
  const rows = query<FeedRow>(
    "SELECT * FROM feeds WHERE id = (:id)",
    { id },
  );
  if (!rows[0]) {
    throw new Error(`No feed with ID ${id}`);
  }
  return rowToFeed(rows[0]);
}

export function getFeedByUrl(feedUrl: string): Feed {
  const rows = query<FeedRow>(
    "SELECT * FROM feeds WHERE url = (:url)",
    { url: feedUrl },
  );
  if (!rows[0]) {
    throw new Error(`No feed with URL ${feedUrl}`);
  }
  return rowToFeed(rows[0]);
}

export function getFeeds(): Feed[] {
  const rows = query<FeedRow>("SELECT * FROM feeds");
  return rows.map(rowToFeed);
}

export function setFeedUrl(id: number, url: string) {
  query("UPDATE feeds SET url = (:url) WHERE id = (:id)", { id, url });
}

export function setFeedDisabled(id: number, disabled = true) {
  query("UPDATE feeds SET disabled = (:disabled) WHERE id = (:id)", {
    id,
    disabled,
  });
}

export function setFeedUpdated(id: number, time?: number) {
  query("UPDATE feeds SET last_update = (:time) WHERE id = (:id)", {
    time: time ?? Date.now(),
    id,
  });
}
