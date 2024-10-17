import { Command } from "@commander-js/extra-typings";
import { Config } from "./config.js";
import { Cache } from "./cache.js";
import { promptPassword } from "./util.js";
import { Client } from "@jason0x43/reader-client";
import { FeedId } from "@jason0x43/reader-types";
import { printJson, printTable, print, printError } from "./output.js";

const program = new Command();

program
	.name("sn")
	.description("CLI to interact with a Reader server")
	.configureHelp({ sortSubcommands: true })
	.showHelpAfterError()
	.version("0.1.0");

program
	.command("config")
	.description("Show the current config")
	.action(async () => {
		const config = Config.load();
		printJson(config);
	});

const hostCmd = program.command("host").description("Manage api hosts");

hostCmd.command("list").action(async () => {
	const config = Config.load();
	const hosts: Record<string, string>[] = [];
	for (const host of Object.keys(config.hosts)) {
		hosts.push({
			host: host === config.activeHost ? `*${host}` : ` ${host}`,
			address: config.hosts[host].address,
		});
	}
	printTable(hosts);
});

hostCmd
	.command("add")
	.description("Add or update a host")
	.argument("<name>", "Name of the host")
	.argument("<address>", "Address of the host")
	.action((name, address) => {
		const config = Config.load();
		config.addHost(name, address);
		printJson(config);
	});

const sessionCmd = program.command("session").description("Manage sessions");

sessionCmd
	.command("login")
	.description("Login to the active host")
	.argument("<username>", "Username")
	.action(async (username) => {
		const password = await promptPassword("Password: ");
		const client = getClient();
		const sessionId = await client.login(username, password);
		const config = Config.load();
		config.session = {
			username,
			sessionId,
		};
		print(`Logged in to ${config.activeHost} as ${username}`);
	});

const feedCmd = program.command("feed").description("Manage feeds");

feedCmd
	.command("test")
	.description("Test a feed URL")
	.argument("<url>", "URL of the feed")
	.action(async (url) => {
		const client = getClient();
		const doc = await client.testFeedUrl(url);
		console.log(JSON.stringify(doc, null, 2));
	});

feedCmd
	.command("list")
	.description("List feeds")
	.option("-j, --json", "JSON output")
	.action(async (options) => {
		const client = getClient();
		const cache = Cache.load();
		const feeds = await client.getFeeds();
		for (const feed of feeds) {
			cache.addId("feed", feed.id);
		}

		if (options.json) {
			printJson(feeds);
		} else {
			printTable(
				feeds
					.map((feed) => ({
						id: feed.id,
						title: feed.title,
					}))
					.sort((a, b) => a.title.localeCompare(b.title)),
				{ showHeader: true },
			);
		}
	});

feedCmd
	.command("show")
	.description("Show config for a feed")
	.argument("<feed_id>", "A feed ID to get logs for", (val) => {
		const cache = Cache.load();
		return FeedId.parse(cache.getMatchingId("feed", val));
	})
	.action(async (feed_id) => {
		const client = getClient();
		const feed = await client.getFeed(feed_id);
		if (feed.icon && feed.icon.startsWith("data:image")) {
			feed.icon = "data:image...";
		}
		printJson(feed);
	});

feedCmd
	.command("update")
	.description("Update a feed")
	.argument("<feed_id>", "A feed ID to update", (val) => {
		const cache = Cache.load();
		return FeedId.parse(cache.getMatchingId("feed", val));
	})
	.option("-u, --url <url>", "A new feed URL")
	.option("-t, --title <title>", "A new feed title")
	.action(async (feed_id, options) => {
		const client = getClient();
		await client.updateFeed(feed_id, {
			title: options.title,
			url: options.url,
		});
		print("Feed updated!");
	});

feedCmd
	.command("log")
	.description("Get feed download logs")
	.argument("[feed_id]", "A feed ID to get logs for", (val) => {
		const cache = Cache.load();
		return FeedId.parse(cache.getMatchingId("feed", val));
	})
	.option("-e, --errors", "Only show errors")
	.option("-t, --text", "Show a text format instead of JSON")
	.action(async (feed_id, options) => {
		const client = getClient();
		let logs = await client.getFeedLogs(feed_id);

		if (options.errors) {
			logs = logs.filter((log) => !log.success);
		}

		if (options.text) {
			for (const log of logs) {
				if (log.success) {
					print(`${log.time} ${log.feed_id} SUCCESS`);
				} else {
					print(`${log.time} ${log.feed_id} ERROR: ${log.message}`);
				}
			}
		} else {
			printJson(logs);
		}
	});

const articlesCmd = program.command("articles").description("Manage articles");

articlesCmd
	.command("saved")
	.description("List saved articles")
	.action(async () => {
		const client = getClient();
		let articles = await client.getSavedArticles();
		printJson(articles);
	});

try {
	await program.parseAsync();
} catch (error) {
	printError(`Error: ${error}`);
}

function getClient(): Client {
	const config = Config.load();
	const host = config.getActiveHost();
	return new Client(host.address, { sessionId: host.session?.sessionId });
}
