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

yargs
  .scriptName('db')
  .strict()

  .command(
    'add-user',
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
    'add-feed',
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
    'add-feed-group',
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
      const user = await prisma.user.findUnique({
        where: {
          username: argv.username,
        },
      });

      if (!user) {
        throw new Error(`Unknown user ${argv.username}`);
      }

      await prisma.feedGroup.create({
        data: {
          userId: user.id,
          name: argv.name,
          feeds: {
            create: argv.feeds.map((feedId) => ({
              feedId,
            })),
          },
        },
      });
    }
  )

  .command(
    'export-feeds',
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
    'import-feeds',
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

  .help().argv;
