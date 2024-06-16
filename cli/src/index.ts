import { Command } from "@commander-js/extra-typings";
import { Config } from "./config.js";
import { promptPassword } from "./util.js";
import { Client } from "simple-news-client";

const program = new Command();

program
	.name("sn")
	.description("CLI to interact with a Simple News server")
	.configureHelp({ sortSubcommands: true })
	.showHelpAfterError()
	.version("0.1.0");

program
	.command("config")
	.description("Show the current config")
	.action(async () => {
		const config = Config.load();
		console.log(config.toJSON());
	});

const hostCmd = program.command("host").description("Manage api hosts");

hostCmd.command("list").action(async () => {
	const config = Config.load();
	for (const host of Object.keys(config.hosts)) {
		if (host === config.activeHost) {
			console.log(`*${host}`);
		} else {
			console.log(` ${host}`);
		}
	}
});

hostCmd
	.command("add")
	.description("Add a new host")
	.argument("<name>", "Name of the host")
	.argument("<address>", "Address of the host")
	.action((name, address) => {
		const config = Config.load();
		config.addHost(name, address);
		console.log(config.toJSON());
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
		console.log(`Logged in to ${config.activeHost} as ${username}`);
	});

try {
	await program.parseAsync();
} catch (error) {
	console.error(`Error: ${error}`);
}

function getClient(): Client {
	const config = Config.load();
	const host = config.getActiveHost();
	return new Client(host.address, { sessionId: host.session?.sessionId });
}
