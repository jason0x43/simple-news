import * as log from "std/log/mod.ts";
import { query } from "./db.ts";
import { Feed } from "../../types.ts";
import { createRowHelpers, parameterize, select } from "./util.ts";

const {
  columns: feedColumns,
  query: feedQuery,
} = createRowHelpers<
  Feed
>()(
  "id",
  "url",
  "title",
  "type",
  "lastUpdate",
  "htmlUrl",
  "disabled",
  "icon",
);

export function addFeed(
  feed: Omit<Feed, "id" | "lastUpdate" | "disabled" | "icon">,
): Feed {
  log.debug(`Adding feed ${JSON.stringify(feed)}`);
  return feedQuery(
    `INSERT INTO feeds (url, title, type)
    VALUES (:url, :title, :type)
    RETURNING ${feedColumns}`,
    feed,
  )[0];
}

export function getFeed(id: number): Feed {
  const feed = feedQuery(
    "SELECT ${feedColumns} FROM feeds WHERE id = (:id)",
    { id },
  )[0];
  if (!feed) {
    throw new Error(`No feed with ID ${id}`);
  }
  return feed;
}

export function getFeeds(feedIds?: number[]): Feed[] {
  if (feedIds) {
    const { names: feedParamNames, values: feedParams } = parameterize(
      "feedIds",
      feedIds,
    );
    return feedQuery(
      `SELECT ${feedColumns}
      FROM feeds
      WHERE id IN (${feedParamNames.join(",")})`,
      feedParams,
    );
  }

  return feedQuery(`SELECT ${feedColumns} FROM feeds`);
}

export function getFeedByUrl(feedUrl: string): Feed {
  const feed = feedQuery(
    `SELECT ${feedColumns} FROM feeds WHERE url = (:url)`,
    { url: feedUrl },
  )[0];
  if (!feed) {
    throw new Error(`No feed with URL ${feedUrl}`);
  }
  return feed;
}

export function getFeedIds(): number[] {
  return select("SELECT id FROM feeds", (row) => row[0] as number);
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

export function setFeedIcon(id: number, icon: string | null) {
  query("UPDATE feeds SET icon = (:icon) WHERE id = (:id)", { icon, id });
}
