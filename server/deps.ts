/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />

export * as color from "https://deno.land/std@0.117.0/fmt/colors.ts";
export { DB } from "https://deno.land/x/sqlite@v3.1.3/mod.ts";
export {
  Application,
  Router,
  send,
} from "https://deno.land/x/oak@v10.0.0/mod.ts";
export { parse as parseXml } from "https://deno.land/x/xml@2.0.2/mod.ts";
export { parseFeed } from "https://deno.land/x/rss@0.5.4/mod.ts";
export type {
  Feed as ParsedFeed,
  FeedEntry,
} from "https://deno.land/x/rss@0.5.4/src/types/mod.ts";
export * as path from "https://deno.land/std@0.117.0/path/mod.ts";

// import to make SSR React (at least v17) happy
import "http://esm.sh/raf@3.4.1/polyfill";

import React from "react";
export { React };

import ReactDOMServer from "react-dom-server";
export { ReactDOMServer };

export {
  DOMParser,
  Element,
} from "https://deno.land/x/deno_dom@v0.1.17-alpha/deno-dom-wasm.ts";

export * as log from "https://deno.land/std@0.117.0/log/mod.ts";

export * as bcrypt from 'https://deno.land/x/bcrypt@v0.2.4/mod.ts';
