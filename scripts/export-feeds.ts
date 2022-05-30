import { prisma } from '../app/lib/db';
import { writeFileSync } from 'fs';
import yargs from 'yargs';

async function main() {
  const argv = await yargs
    .scriptName('export-feeds')
    .usage('$0 [file]', 'export feeds, optionally to a file')
    .positional('file', {
      describe: 'A file to export to',
      type: 'string',
    })
    .help()
    .argv

  const feeds = await prisma.feed.findMany();
  if (argv.file) {
    writeFileSync(argv.file, JSON.stringify(feeds, null, '  '));
  } else {
    console.log(feeds);
  }
}

main().catch((error) => {
  console.error(`${error}`);
});
