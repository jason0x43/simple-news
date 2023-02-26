import { readFileSync, writeFileSync } from 'fs';
import readline from 'readline';
import { Writable } from 'stream';
import { inspect } from 'util';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { z } from 'zod';
import 'zx/globals';
import { deleteFeedArticles } from '../src/lib/db/article.js';
import type { Feed } from '../src/lib/db/feed.js';
import { createFeed, getFeedByUrl, getFeeds } from '../src/lib/db/feed.js';
import {
	addFeedsToGroup,
	createFeedGroup,
	deleteFeedGroup,
	getGroupFeeds,
	getUserFeedGroup,
	getUserFeedGroups,
	getUserFeeds,
	removeFeedsFromGroup
} from '../src/lib/db/feedgroup.js';
import {
	FeedGroupFeedSchema,
	FeedGroupSchema,
	FeedSchema
} from '../src/lib/db/lib/db.js';
import { createUser, getUserByUsername } from '../src/lib/db/user.js';

type MutableWritable = Writable & { muted?: boolean };

const mutableStdout: MutableWritable = new Writable({
	write(this: MutableWritable, chunk, encoding, callback) {
		if (!this.muted) {
			process.stdout.write(chunk, encoding);
		}
		callback();
	}
});

const ExportedFeedGroupSchema = z.intersection(
	FeedGroupSchema,
	z.object({
		feeds: z.array(
			z.intersection(
				FeedGroupFeedSchema,
				z.object({
					feed: FeedSchema
				})
			)
		)
	})
);
const ExportedFeedGroupArraySchema = z.array(ExportedFeedGroupSchema);

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
				html_url: argv.htmlUrl
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

			const user = await getUserByUsername(argv.username);
			const feeds = await getFeeds();
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
		async (argv) => {
			const user = await getUserByUsername(argv.username);
			await deleteFeedGroup({
				user_id: user.id,
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

			const user = await getUserByUsername(argv.username);
			const userFeeds = await getUserFeeds(user.id);
			const alreadyGrouped: Set<string> = new Set();
			for (const feed of userFeeds) {
				alreadyGrouped.add(feed.id);
			}

			const groupFeeds: string[] = [];
			const feeds = await getFeeds();

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

			const user = await getUserByUsername(argv.username);
			const groups = await getUserFeedGroups(user.id);
			const group = groups.find((g) => g.name === argv.name);

			if (!group) {
				throw new Error(`Unknown group name ${argv.name}`);
			}

			const feeds = await getFeeds();
			const userFeeds = await getUserFeeds(user.id);
			const alreadyGrouped: Set<string> = new Set();
			for (const feed of userFeeds) {
				alreadyGrouped.add(feed.id);
			}

			const existingGroupFeeds: string[] = (await getGroupFeeds(group.id)).map(
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

					const group = await getUserFeedGroup(user.id, argv.name);
					if (group) {
						addFeedsToGroup(group.id, toAdd);
						removeFeedsFromGroup(group.id, toRemove);
					}

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
		for (const feed of await getFeeds()) {
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
			const user = await getUserByUsername(argv.username);
			const groups = await getUserFeedGroups(user.id);
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
					html_url: feed.htmlUrl
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
			const user = await getUserByUsername(argv.username);
			const groupData = ExportedFeedGroupArraySchema.parse(
				JSON.parse(readFileSync(argv.file, { encoding: 'utf8' }))
			);

			for (const group of groupData) {
				const feedUrls = group.feeds.map((f) => f.feed.url);
				const feeds: Feed[] = [];
				for (const url of feedUrls) {
					const feed = await getFeedByUrl(url);
					if (feed) {
						feeds.push(feed);
					}
				}

				createFeedGroup({
					userId: user.id,
					name: group.name,
					feeds: feeds.map(({ id }) => id)
				});
			}
		}
	)

	.command(
		'schema [outfile]',
		'write the database schema to a file',
		(yargs) => {
			yargs.positional('outfile', {
				describe: 'Optional name for the output file',
				type: 'string'
			});
		},
		async (argv) => {
			let outfile = argv.outfile ?? '';
			if (!outfile) {
				const dt = new Date();
				const y = `${dt.getFullYear()}`;
				const m = `${dt.getMonth() + 1}`.padStart(2, '0');
				const d = `${dt.getDate()}`.padStart(2, '0');
				const hr = `${dt.getHours()}`.padStart(2, '0');
				const mn = `${dt.getMinutes()}`.padStart(2, '0');
				const sc = `${dt.getSeconds()}`.padStart(2, '0');
				outfile = `schema/schema_${y}${m}${d}${hr}${mn}${sc}.sql`;
			}
			echo`db: ${process.env.DB_FILE}`;
			const dir = await $`dirname ${outfile}`;
			await $`mkdir -p ${dir}`;
			await $`echo .schema | sqlite3 ${process.env.DB_FILE} > ${outfile}`;
		}
	)

	.parse();
