import { prisma } from '../app/lib/db';
import bcrypt from 'bcryptjs';
import yargs from 'yargs';
import readline from 'readline';
import { Writable } from 'stream';

let muted = false;

const mutableStdout = new Writable({
  write(chunk, encoding, callback) {
    if (!muted) {
      process.stdout.write(chunk, encoding);
    }
    callback();
  },
});

async function main() {
  const argv = await yargs
    .scriptName('add-user')
    .usage('$0 <username> <email>', 'add a user')
    .positional('username', {
      describe: 'A username',
      demandOption: true,
      type: 'string',
    })
    .positional('email', {
      describe: "User's email address",
      demandOption: true,
      type: 'string',
    })
    .help().argv;

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
    muted = true;
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

main().catch((error) => {
  console.error(`${error}`);
});
