import { readFileSync, writeFileSync } from 'fs';
import readline from 'readline';
import { Writable } from 'stream';
import { inspect } from 'util';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Feed, FeedGroup, FeedGroupFeed } from '../src/lib/db/schema';
import { createUser, getUserByUsername } from '../src/lib/db/user';
import { createFeed, getFeedByUrl, getFeeds } from '../src/lib/db/feed';
import {
  addFeedsToGroup,
  getGroupFeeds,
  getUserFeeds,
  removeFeedsFromGroup
} from '../src/lib/db/feedgroupfeed';
import {
  createFeedGroup,
  deleteFeedGroup,
  getFeedGroup,
  getUserFeedGroups
} from '../src/lib/db/feedgroup';
import { deleteFeedArticles } from '../src/lib/db/article';

type MutableWritable = Writable & { muted?: boolean };

const mutableStdout: MutableWritable = new Writable({
  write(this: MutableWritable, chunk, encoding, callback) {
    if (!this.muted) {
      process.stdout.write(chunk, encoding);
    }
    callback();
  }
});

type ExportedFeedGroup = FeedGroup & {
  feeds: (FeedGroupFeed & { feed: Feed })[];
};

yargs(hideBin(process.argv))
  .scriptName('db')
  .strict()
  .demandCommand()
  .help()

  .command(
    'add-user <username> <email>',
    'Add a user',
    (yargs) => {
      return yargs
        .positional('username', {
          describe: 'A username',
          demandOption: true,
          type: 'string'
        })
        .positional('email', {
          describe: "User's email address",
          demandOption: true,
          type: 'string'
        });
    },
    async (argv) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: mutableStdout,
        terminal: true
      });

      const password = await new Promise<string>((resolve) => {
        rl.question('Password? ', function (pw) {
          resolve(pw);
          process.stdout.write('\n');
          rl.close();
        });
        mutableStdout.muted = true;
      });

      createUser(argv, password);
    }
  )

  .command(
    'add-feed <url> <title> [options]',
    'Add a feed',
    (yargs) => {
      return yargs
        .positional('url', {
          describe: 'A feed URL',
          demandOption: true,
          type: 'string'
        })
        .positional('title', {
          describe: 'The title of the feed',
          demandOption: true,
          type: 'string'
        })
        .options({
          icon: {
            alias: 'i',
            type: 'string',
            describe: 'The feed icon URL',
            default: null
          },
          'html-url': {
            type: 'string',
            describe: 'An associated HTML URL for the feed',
            default: null
          }
        });
    },
    (argv) => {
      createFeed({
        url: argv.url,
        title: argv.title,
        icon: argv.icon,
        htmlUrl: argv.htmlUrl
      });
    }
  )

  .command(
    'clear-feed <id>',
    'Clear all download articles from a feed',
    (yargs) => {
      return yargs.positional('id', {
        describe: 'A feed ID',
        demandOption: true,
        type: 'string'
      });
    },
    (argv) => {
      deleteFeedArticles(argv.id);
    }
  )

  .command(
    'add-feed-group <username> <name>',
    'Add a feed group for a user',
    (yargs) => {
      return yargs
        .positional('username', {
          describe: 'The user to add the group to',
          demandOption: true,
          type: 'string'
        })
        .positional('name', {
          describe: 'The name of the feed group',
          demandOption: true,
          type: 'string'
        });
    },
    async (argv) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true
      });

      const user = getUserByUsername(argv.username);
      const feeds = getFeeds();
      const groupFeeds: string[] = [];

      for (;;) {
        rl.write(`Feeds in ${argv.name}:\n`);
        for (const id of groupFeeds) {
          const feed = feeds.find((f) => f.id === id) as Feed;
          rl.write(`  * ${id}: ${feed.title}\n`);
        }
        rl.write('\n');

        rl.write('1. Add feed\n');
        rl.write('2. Remove feed\n');
        rl.write('3. Save and quit\n');
        rl.write('\n');

        const answer = await new Promise<string>((resolve) => {
          rl.question('> ', resolve);
        });
        rl.write('\n');

        if (answer === '1') {
          const otherFeeds = feeds.filter((f) => !groupFeeds.includes(f.id));
          for (let i = 0; i < otherFeeds.length; i++) {
            const f = otherFeeds[i];
            rl.write(`${i + 1}. ${f.id}: ${f.title}\n`);
          }
          rl.write('\n');

          const fid = await new Promise<string>((resolve) => {
            rl.question('Feed to add> ', resolve);
          });
          rl.write('\n');

          if (fid) {
            groupFeeds.push(otherFeeds[Number(fid) - 1].id);
          }
        } else if (answer === '2') {
          for (let i = 0; i < groupFeeds.length; i++) {
            const f = feeds.find((f) => f.id === groupFeeds[i]) as Feed;
            rl.write(`${i + 1}. ${f.id}: ${f.title}\n`);
          }
          rl.write('\n');

          const idx = await new Promise<string>((resolve) => {
            rl.question('Feed to remove> ', resolve);
          });
          rl.write('\n');

          if (idx) {
            groupFeeds.splice(Number(idx) - 1, 1);
          }
        } else if (answer === '3') {
          createFeedGroup({
            userId: user.id,
            name: argv.name,
            feeds: groupFeeds
          });
          rl.close();
          break;
        }
      }
    }
  )

  .command(
    'del-feed-group <username> <name>',
    'Delete a user feed group',
    (yargs) => {
      return yargs
        .positional('username', {
          describe: 'The user to add the group to',
          demandOption: true,
          type: 'string'
        })
        .positional('name', {
          describe: 'The name of the feed group',
          demandOption: true,
          type: 'string'
        });
    },
    (argv) => {
      const user = getUserByUsername(argv.username);
      deleteFeedGroup({
        userId: user.id,
        name: argv.name
      });
    }
  )

  .command(
    'add-feed-group <username> <name> [feeds..]',
    'Add a feed group for a user',
    (yargs) => {
      return yargs
        .positional('username', {
          describe: 'The user to add the group to',
          demandOption: true,
          type: 'string'
        })
        .positional('name', {
          describe: 'The name of the feed group',
          demandOption: true,
          type: 'string'
        })
        .positional('feeds', {
          describe: 'The feed IDs to include in the group',
          type: 'string',
          default: []
        });
    },
    async (argv) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true
      });

      const user = getUserByUsername(argv.username);
      const userFeeds = getUserFeeds(user.id);
      const alreadyGrouped: Set<string> = new Set();
      for (const feed of userFeeds) {
        alreadyGrouped.add(feed.id);
      }

      const groupFeeds: string[] = [];
      const feeds = getFeeds();

      for (;;) {
        rl.write(`Feeds in ${argv.name}:\n`);
        for (const id of groupFeeds) {
          const feed = feeds.find((f) => f.id === id) as Feed;
          rl.write(`  * ${id}: ${feed.title}\n`);
        }
        rl.write('\n');

        rl.write('1. Add feed\n');
        rl.write('2. Remove feed\n');
        rl.write('3. Save and quit\n');
        rl.write('\n');

        const answer = await new Promise<string>((resolve) => {
          rl.question('> ', resolve);
        });
        rl.write('\n');

        if (answer === '1') {
          const otherFeeds = feeds.filter(
            (f) => !groupFeeds.includes(f.id) && !alreadyGrouped.has(f.id)
          );
          for (let i = 0; i < otherFeeds.length; i++) {
            const f = otherFeeds[i];
            rl.write(`${i + 1}. ${f.id}: ${f.title}\n`);
          }
          rl.write('\n');

          const fid = await new Promise<string>((resolve) => {
            rl.question('Feed to add> ', resolve);
          });
          rl.write('\n');

          if (fid) {
            groupFeeds.push(otherFeeds[Number(fid) - 1].id);
          }
        } else if (answer === '2') {
          for (let i = 0; i < groupFeeds.length; i++) {
            const f = feeds.find((f) => f.id === groupFeeds[i]) as Feed;
            rl.write(`${i + 1}. ${f.id}: ${f.title}\n`);
          }
          rl.write('\n');

          const idx = await new Promise<string>((resolve) => {
            rl.question('Feed to remove> ', resolve);
          });
          rl.write('\n');

          if (idx) {
            groupFeeds.splice(Number(idx) - 1, 1);
          }
        } else if (answer === '3') {
          createFeedGroup({
            userId: user.id,
            name: argv.name,
            feeds: groupFeeds
          });
          rl.close();
          break;
        }
      }
    }
  )

  .command(
    'mod-feed-group <username> <name> [feeds..]',
    'Modify a user feed group',
    (yargs) => {
      return yargs
        .positional('username', {
          describe: 'The user to add the group to',
          demandOption: true,
          type: 'string'
        })
        .positional('name', {
          describe: 'The name of the feed group',
          demandOption: true,
          type: 'string'
        });
    },
    async (argv) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true
      });

      const user = getUserByUsername(argv.username);
      const groups = getUserFeedGroups(user.id);
      const group = groups.find((g) => g.name === argv.name);

      if (!group) {
        throw new Error(`Unknown group name ${argv.name}`);
      }

      const feeds = getFeeds();
      const userFeeds = getUserFeeds(user.id);
      const alreadyGrouped: Set<string> = new Set();
      for (const feed of userFeeds) {
        alreadyGrouped.add(feed.id);
      }

      const existingGroupFeeds: string[] = getGroupFeeds(group.id).map(
        (feed) => feed.id
      );
      const groupFeeds: string[] = existingGroupFeeds.slice();

      for (;;) {
        rl.write(`Feeds in ${argv.name}:\n`);
        for (const id of groupFeeds) {
          const feed = feeds.find((f) => f.id === id) as Feed;
          rl.write(`  * ${id}: ${feed.title}\n`);
        }
        rl.write('\n');

        rl.write('1. Add feed\n');
        rl.write('2. Remove feed\n');
        rl.write('3. Save and quit\n');
        rl.write('\n');

        const answer = await new Promise<string>((resolve) => {
          rl.question('> ', resolve);
        });
        rl.write('\n');

        if (answer === '1') {
          const otherFeeds = feeds.filter(
            (f) => !groupFeeds.includes(f.id) && !alreadyGrouped.has(f.id)
          );
          for (let i = 0; i < otherFeeds.length; i++) {
            const f = otherFeeds[i];
            rl.write(`${i + 1}. ${f.id}: ${f.title}\n`);
          }
          rl.write('\n');

          const fid = await new Promise<string>((resolve) => {
            rl.question('Feed to add> ', resolve);
          });
          rl.write('\n');

          if (fid) {
            groupFeeds.push(otherFeeds[Number(fid) - 1].id);
          }
        } else if (answer === '2') {
          for (let i = 0; i < groupFeeds.length; i++) {
            const f = feeds.find((f) => f.id === groupFeeds[i]) as Feed;
            rl.write(`${i + 1}. ${f.id}: ${f.title}\n`);
          }
          rl.write('\n');

          const idx = await new Promise<string>((resolve) => {
            rl.question('Feed to remove> ', resolve);
          });
          rl.write('\n');

          if (idx) {
            groupFeeds.splice(Number(idx) - 1, 1);
          }
        } else if (answer === '3') {
          const toRemove: string[] = [];
          for (const id of existingGroupFeeds) {
            if (!groupFeeds.includes(id)) {
              toRemove.push(id);
            }
          }

          const toAdd: string[] = [];
          for (const id of groupFeeds) {
            if (!existingGroupFeeds.includes(id)) {
              toAdd.push(id);
            }
          }

          const group = getFeedGroup(user.id, argv.name);
          addFeedsToGroup(group.id, toAdd);
          removeFeedsFromGroup(group.id, toRemove);

          rl.close();
          break;
        }
      }
    }
  )

  .command(
    'export-feeds [file]',
    'Export feeds to JSON',
    (yargs) => {
      return yargs.positional('file', {
        describe: 'A file to export to',
        type: 'string'
      });
    },
    async (argv) => {
      const feeds = getFeeds();
      if (argv.file) {
        writeFileSync(argv.file, JSON.stringify(feeds, null, '  '));
      } else {
        console.log(feeds);
      }
    }
  )

  .command('list-feeds', 'List feeds', {}, async () => {
    for (const feed of getFeeds()) {
      console.log(`${feed.id}: ${feed.title}`);
    }
  })

  .command(
    'export-feed-groups <username> [file]',
    "Export a user's feed groups to JSON",
    (yargs) => {
      return yargs
        .positional('username', {
          describe: 'A username',
          demandOption: true,
          type: 'string'
        })
        .positional('file', {
          describe: 'A file to export to',
          type: 'string'
        });
    },
    async (argv) => {
      const user = getUserByUsername(argv.username);
      const groups = getUserFeedGroups(user.id);
      if (argv.file) {
        writeFileSync(argv.file, JSON.stringify(groups, null, '  '));
      } else {
        console.log(inspect(groups, false, null, true));
      }
    }
  )

  .command(
    'import-feeds <file>',
    'Import feeds from a JSON file',
    (yargs) => {
      return yargs.positional('file', {
        describe: 'A file to export to',
        demandOption: true,
        type: 'string'
      });
    },
    async (argv) => {
      const feedData = JSON.parse(
        readFileSync(argv.file, { encoding: 'utf8' })
      );

      for (const feed of feedData) {
        createFeed({
          id: feed.id,
          url: feed.url,
          title: feed.title,
          icon: feed.icon,
          htmlUrl: feed.htmlUrl
        });
      }
    }
  )

  .command(
    'import-feed-groups <username> <file>',
    'Import feed groups from a JSON file for a user',
    (yargs) => {
      return yargs
        .positional('username', {
          describe: 'A username',
          demandOption: true,
          type: 'string'
        })
        .positional('file', {
          describe: 'A file to export to',
          demandOption: true,
          type: 'string'
        });
    },
    async (argv) => {
      const user = getUserByUsername(argv.username);
      const groupData = JSON.parse(
        readFileSync(argv.file, { encoding: 'utf8' })
      ) as ExportedFeedGroup[];

      for (const group of groupData) {
        const feedUrls = group.feeds.map((f) => f.feed.url);
        const feeds: Feed[] = [];
        for (const url of feedUrls) {
          feeds.push(getFeedByUrl(url));
        }

        createFeedGroup({
          userId: user.id,
          name: group.name,
          feeds: feeds.map(({ id }) => id)
        });
      }
    }
  )

  .parse();
