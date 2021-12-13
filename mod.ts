/// <reference no-default-lib="true" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import { Arguments, log, Yargs, yargs } from "./deps.ts";
import { serve } from "./server/mod.ts";
import {
  addUser,
  getArticleCount,
  getFeed,
  getFeeds,
  getUserByEmail,
  isUserPassword,
  openDatabase,
  setFeedDisabled,
  setFeedUrl,
  updateUserPassword,
} from "./server/database/mod.ts";
import { formatArticles, refreshFeeds } from "./server/feed.ts";
import { exportOpmlFile, importOpmlFile } from "./server/opml.ts";
import { printTable, promptSecret } from "./server/util.ts";

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
    () => openDatabase(),
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
  .command(
    "adduser <email> <name>",
    "Add a new user",
    (yargs: Yargs) => {
      yargs.positional("email", {
        describe: "An email address for the new account",
        type: "string",
      });
      yargs.positional("name", {
        describe: "The user's name, or a username",
        type: "string",
      });
    },
    async (args: Arguments & { email: string; name: string }) => {
      const password = await promptSecret("Password: ");
      if (password) {
        const user = addUser({ email: args.email, name: args.name }, password);
        console.log(`Created user ${user.id}`);
      } else {
        console.log("Add cancelled");
      }
    },
  )
  .command(
    "resetpw <email>",
    "Reset a user password",
    (yargs: Yargs) => {
      yargs.positional("email", {
        describe: "An existing account email address",
        type: "string",
      });
    },
    async (args: Arguments & { email: string }) => {
      const user = getUserByEmail(args.email);
      const password = await promptSecret("Password: ");
      if (password) {
        updateUserPassword(user.id, password);
        console.log(`Updated password for user ${user.id}`);
      } else {
        console.log("Update cancelled");
      }
    },
  )
  .command(
    "login <email>",
    "Authenticate as a given user",
    (yargs: Yargs) => {
      yargs.positional("email", {
        describe: "An existing account email address",
        type: "string",
      });
    },
    async (args: Arguments & { email: string }) => {
      const user = getUserByEmail(args.email);
      const password = await promptSecret("Password: ");
      if (password) {
        if (isUserPassword(user.id, password)) {
          console.log("Login successful");
        } else {
          console.log("Invalid password");
        }
      }
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
