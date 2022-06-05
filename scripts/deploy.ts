import yargs from 'yargs';
import { execSync } from 'child_process';

const deployHost = process.env.DEPLOY_HOST;
const deployRepo = process.env.DEPLOY_REPO;

if (!deployHost) {
  console.log('DEPLOY_HOST environment variable must be defined');
  process.exit(1);
}

if (!deployRepo) {
  console.log('DEPLOY_REPO environment variable must be defined');
  process.exit(1);
}

async function main() {
  await yargs.scriptName('deploy').usage('$0', 'deploy to a server').help()
    .argv;

  console.log('>>> Pushing main branch...');
  execSync(`git push origin main`, {
    stdio: 'inherit',
  });

  execSync(`ssh ${deployHost} 'bash -s'`, {
    stdio: ['pipe', 'inherit', 'inherit'],
    input: [
      `cd ${deployRepo}`,
      'echo ">>> Pulling changes into remote repo..."',
      'git pull origin main',
      'echo ">>> Installing updated npm packages..."',
      'npm install',
      'echo ">>> Running migrations..."',
      'npm run migrate',
    ].join('\n'),
  });

  console.log('>>> Restarting app server...');
  execSync(`ssh ${deployHost} systemctl --user restart --now simple-news`, {
    stdio: 'inherit',
  });

  console.log('>>> Restarting feed downloader...');
  execSync(
    `ssh ${deployHost} systemctl --user restart --now simple-news-downloader`,
    {
      stdio: 'inherit',
    }
  );

  console.log('>>> Done');
}

main().catch((error) => {
  console.error(`${error}`);
});
