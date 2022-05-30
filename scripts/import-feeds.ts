import { prisma } from '../app/lib/db';
import { readFileSync } from 'fs';
import yargs from 'yargs';

async function main() {
  const argv = await yargs
    .scriptName('import-feeds')
    .usage('$0 <file>', 'import feeds from a JSON file')
    .positional('file', {
      describe: 'A file to export to',
      demandOption: true,
      type: 'string',
    })
    .help()
    .argv

  const feedData = JSON.parse(readFileSync(argv.file, { encoding: 'utf8' }));

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
        htmlUrl: feed.htmlUrl
      }
    });
  }

  console.log(`Processed ${feedData.length} feeds`);
}

main().catch((error) => {
  console.error(`${error}`);
});
