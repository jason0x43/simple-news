import { prisma } from '../app/lib/db';
import yargs from 'yargs';

async function main() {
  const argv = await yargs
    .scriptName('add-feed')
    .usage('$0 <url> <title> [options]', 'add a feed')
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
    })
    .help().argv;

  await prisma.feed.create({
    data: {
      url: argv.url,
      title: argv.title,
      icon: argv.icon,
      htmlUrl: argv.htmlUrl
    },
  });
}

main().catch((error) => {
  console.error(`${error}`);
});
