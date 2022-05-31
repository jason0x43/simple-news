import { Feed } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { readFileSync, writeFileSync } from 'fs';
import readline from 'readline';
import { Writable } from 'stream';
import yargs from 'yargs';
import { prisma } from '../app/lib/db';

type MutableWritable = Writable & { muted?: boolean };

const mutableStdout: MutableWritable = new Writable({
  write(this: MutableWritable, chunk, encoding, callback) {
    if (!this.muted) {
      process.stdout.write(chunk, encoding);
    }
    callback();
  },
});

async function getUser(username: string) {
  return await prisma.user.findUnique({
    where: {
      username,
    },
    include: {
      feedGroups: {
        include: {
          feeds: {
            include: {
              feed: true,
            },
          },
        },
      },
    },
    rejectOnNotFound: true,
  });
}

yargs
  .scriptName('db')
  .strict()

  .command(
    'add-user <username> <email>',
    'Add a user',
    (yargs) => {
      return yargs
        .positional('username', {
          describe: 'A username',
          demandOption: true,
          type: 'string',
        })
        .positional('email', {
          describe: "User's email address",
          demandOption: true,
          type: 'string',
        });
    },
    async (argv) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: mutableStdout,
        terminal: true,
      });

      const password = await new Promise<string>((resolve) => {
        rl.question('Password? ', function (pw) {
          resolve(pw);
          process.stdout.write('\n');
          rl.close();
        });
        mutableStdout.muted = true;
      });

      await prisma.user.create({
        data: {
          username: argv.username,
          email: argv.email,
          password: {
            create: {
              hash: await bcrypt.hash(password, 7),
            },
          },
        },
      });
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
          type: 'string',
        })
        .positional('title', {
          describe: 'The title of the feed',
          demandOption: true,
          type: 'string',
        })
        .options({
          icon: {
            alias: 'i',
            type: 'string',
            describe: 'The feed icon URL',
            default: null,
          },
          'html-url': {
            type: 'string',
            describe: 'An associated HTML URL for the feed',
            default: null,
          },
        });
    },
    async (argv) => {
      await prisma.feed.create({
        data: {
          url: argv.url,
          title: argv.title,
          icon: argv.icon,
          htmlUrl: argv.htmlUrl,
        },
      });
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
          type: 'string',
        })
        .positional('name', {
          describe: 'The name of the feed group',
          demandOption: true,
          type: 'string',
        });
    },
    async (argv) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
      });

      const user = await getUser(argv.username);
      const feeds = await prisma.feed.findMany();
      const groupFeeds: string[] = [];

      while (true) {
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
          await prisma.feedGroup.create({
            data: {
              userId: user.id,
              name: argv.name,
              feeds: {
                create: groupFeeds.map((feedId) => ({
                  feedId,
                })),
              },
            },
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
          type: 'string',
        })
        .positional('name', {
          describe: 'The name of the feed group',
          demandOption: true,
          type: 'string',
        });
    },
    async (argv) => {
      const user = await getUser(argv.username);

      await prisma.feedGroup.delete({
        where: {
          userId_name: {
            userId: user.id,
            name: argv.name,
          },
        },
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
          type: 'string',
        })
        .positional('name', {
          describe: 'The name of the feed group',
          demandOption: true,
          type: 'string',
        })
        .positional('feeds', {
          describe: 'The feed IDs to include in the group',
          type: 'string',
          default: [],
        });
    },
    async (argv) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
      });

      const user = await getUser(argv.username);
      const feeds = await prisma.feed.findMany();
      const groups = user.feedGroups;
      const alreadyGrouped: Set<string> = new Set();
      for (const group of groups) {
        for (const feed of group.feeds) {
          alreadyGrouped.add(feed.feedId);
        }
      }

      const groupFeeds: string[] = [];

      while (true) {
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
          await prisma.feedGroup.create({
            data: {
              userId: user.id,
              name: argv.name,
              feeds: {
                create: groupFeeds.map((feedId) => ({
                  feedId,
                })),
              },
            },
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
          type: 'string',
        })
        .positional('name', {
          describe: 'The name of the feed group',
          demandOption: true,
          type: 'string',
        });
    },
    async (argv) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
      });

      const user = await getUser(argv.username);
      const group = user.feedGroups.find((g) => g.name === argv.name);

      if (!group) {
        throw new Error(`Unknown group name ${argv.name}`);
      }

      const feeds = await prisma.feed.findMany();
      const groups = user.feedGroups;
      const alreadyGrouped: Set<string> = new Set();
      for (const group of groups) {
        for (const feed of group.feeds) {
          alreadyGrouped.add(feed.feedId);
        }
      }

      const existingGroupFeeds: string[] = group.feeds.map(
        (feed) => feed.feedId
      );
      const groupFeeds: string[] = existingGroupFeeds.slice();

      while (true) {
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

          await prisma.feedGroup.update({
            where: {
              userId_name: {
                userId: user.id,
                name: argv.name,
              },
            },
            data: {
              feeds: {
                create: toAdd.map((feedId) => ({
                  feedId,
                })),
                deleteMany: toRemove.map((feedId) => ({
                  feedId,
                })),
              },
            },
          });
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
        type: 'string',
      });
    },
    async (argv) => {
      const feeds = await prisma.feed.findMany();
      if (argv.file) {
        writeFileSync(argv.file, JSON.stringify(feeds, null, '  '));
      } else {
        console.log(feeds);
      }
    }
  )

  .command(
    'export-feed-groups <username> [file]',
    "Export a user's feed groups to JSON",
    (yargs) => {
      return yargs
        .positional('username', {
          describe: 'A username',
          demandOption: true,
          type: 'string',
        })
        .positional('file', {
          describe: 'A file to export to',
          type: 'string',
        });
    },
    async (argv) => {
      const user = await getUser(argv.username);
      const groups = await prisma.feedGroup.findMany({
        where: {
          userId: user.id,
        },
      });
      if (argv.file) {
        writeFileSync(argv.file, JSON.stringify(groups, null, '  '));
      } else {
        console.log(groups);
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
        type: 'string',
      });
    },
    async (argv) => {
      const feedData = JSON.parse(
        readFileSync(argv.file, { encoding: 'utf8' })
      );

      for (const feed of feedData) {
        await prisma.feed.upsert({
          where: {
            url: feed.url,
          },
          update: {},
          create: {
            id: feed.id,
            url: feed.url,
            title: feed.title,
            icon: feed.icon,
            htmlUrl: feed.htmlUrl,
          },
        });
      }
    }
  )

  .demandCommand()
  .help().argv;
