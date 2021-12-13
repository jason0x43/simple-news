/// <reference no-default-lib="true" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import { Arguments, log, Yargs, yargs } from "./deps.ts";
import { serve } from "./server/mod.ts";
import {
  getArticleCount,
  getFeed,
  getFeeds,
  openDatabase,
  setFeedDisabled,
  setFeedUrl,
} from "./server/database/mod.ts";
import { refreshFeeds, formatArticles } from "./server/feed.ts";
import { exportOpmlFile, importOpmlFile } from "./server/opml.ts";
import { printTable } from "./server/util.ts";

async function configureLogger(args: Arguments) {
  await log.setup({
    handlers: {
      default: new log.handlers.ConsoleHandler("DEBUG"),
    },
    loggers: {
      default: {
        level: args.verbose ? "DEBUG" : "INFO",
        handlers: ["default"],
      },
    },
  });
}

const parser = yargs(Deno.args)
  .strict()
  .version("0.1.0")
  .option("v", {
    alias: "verbose",
    describe: "Enable more verbose output",
    type: "boolean",
  })
  .option("h", {
    alias: "help",
  })
  .middleware([
    configureLogger,
    () => openDatabase()
  ])
  .command("serve", "Start the RSS aggregator server", {}, async () => {
    await serve();
  })
  .command("refresh [urls..]", "Refresh feeds", (yargs: Yargs) => {
    yargs.positional("urls", {
      describe: "One or more feed URLs",
      type: "string",
    });
  }, async (args: Arguments & { urls: string[] }) => {
    await refreshFeeds(args.urls);
  })
  .command(
    "import <email> <file>",
    "Import OPML for an account",
    (yargs: Yargs) => {
      yargs.positional("email", {
        describe: "A user email address",
        type: "string",
      }).positional("file", {
        describe: "An OPML file",
        type: "string",
      });
    },
    async (args: Arguments & { email: string; file: string }) => {
      await importOpmlFile(args);
    },
  )
  .command(
    "export <email> <file>",
    "Export OPML for an account to a file",
    (yargs: Yargs) => {
      yargs.positional("email", {
        describe: "A user email address",
        type: "string",
      }).positional("file", {
        describe: "A destination OPML file",
        type: "string",
      });
    },
    async (args: Arguments & { email: string; file: string }) => {
      await exportOpmlFile(args);
    },
  )
  .command(
    "feeds",
    "List avaialable feeds",
    {},
    () => {
      const feeds = getFeeds();
      const rows = feeds.map((feed) => {
        const { id, url, disabled } = feed;
        const articles = getArticleCount(id);
        return { id, url, disabled, articles };
      });
      printTable(rows);
    },
  )
  .command(
    "set-url <feedId> <url>",
    "Change the URL for a feed",
    (yargs: Yargs) => {
      yargs.positional("feedId", {
        describe: "A feed ID",
        type: "number",
      }).positional("url", {
        describe: "A feed URL",
        type: "string",
      });
    },
    (args: Arguments & { feedId: number; url: string }) => {
      setFeedUrl(args.feedId, args.url);
    },
  )
  .command(
    "toggle-feed <feedId>",
    "Toggle a feed's disabled status",
    (yargs: Yargs) => {
      yargs.positional("feedId", {
        describe: "A feed ID",
        type: "number",
      });
    },
    (args: Arguments & { feedId: number }) => {
      const feed = getFeed(args.feedId);
      setFeedDisabled(feed.id, !feed.disabled);
      console.log(`Feed ${feed.id} is ${feed.disabled ? "en" : "dis"}abled`);
    },
  )
  .command(
    "reprocess",
    "Reprocess the data in the database",
    {},
    () => {
      formatArticles();
    },
  )
  .demandCommand(1, "");

let code = 0;

try {
  await parser.parse();
} catch {
  // ignore errors here; they're handled in .fail
  code = 1;
}

// Forcibly exit because something keeps the process open
Deno.exit(code);
