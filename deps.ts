export * as color from "https://deno.land/std@0.115.1/fmt/colors.ts";
export { DB } from "https://deno.land/x/sqlite@v3.1.3/mod.ts";
export {
  Application,
  Router,
  send,
} from "https://deno.land/x/oak@v10.0.0/mod.ts";
export { parse as parseXml } from "https://deno.land/x/xml@2.0.2/mod.ts";
export { parseFeed } from "https://deno.land/x/rss@0.5.4/mod.ts";
export type { FeedEntry } from "https://deno.land/x/rss@0.5.4/src/types/mod.ts";
export * as log from "https://deno.land/std@0.115.1/log/mod.ts";
export * as path from "https://deno.land/std@0.115.1/path/mod.ts";

import yargs from "https://deno.land/x/yargs@v17.2.1-deno/deno.ts";
export { yargs };

import { Arguments } from "https://deno.land/x/yargs@v17.2.1-deno/deno-types.ts";
export type { Arguments };

type Yargs = ReturnType<typeof yargs>;
export type { Yargs };

// import to make SSR React (at least v17) happy
import "http://esm.sh/raf@3.4.1/polyfill";

import React from "https://esm.sh/react@17?dev";
export { React };

import ReactDOMServer from "https://esm.sh/react-dom@17/server?dev";
export { ReactDOMServer };
