import { SessionId } from "@jason0x43/reader-types";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { z } from "zod";

const dataDir = `${process.env.HOME}/.config/reader-cli`;

const Session = z.object({
	username: z.string(),
	sessionId: SessionId,
});

type Session = z.infer<typeof Session>;

const Host = z.object({
	address: z.string(),
	session: z.optional(Session),
});

type Host = z.infer<typeof Host>;

const ConfigData = z.object({
	hosts: z.record(Host),
	activeHost: z.optional(z.string()),
});

type ConfigData = z.infer<typeof ConfigData>;

const constructorKey = Symbol();

export class Config {
	static get path() {
		return `${dataDir}/config.json`;
	}

	static load(): Config {
		try {
			const data = readFileSync(Config.path, "utf-8");
			const configData = ConfigData.parse(JSON.parse(data));
			return new Config(constructorKey, configData);
		} catch (e) {
			console.warn(`Error parsing config: ${e}`);
			return new Config(constructorKey, {
				hosts: {},
			} satisfies ConfigData);
		}
	}

	#data: ConfigData;

	private constructor(key: symbol, data: ConfigData) {
		if (key !== constructorKey) {
			throw new Error("use Config.load() to create a Config instance");
		}
		this.#data = data;
	}

	save() {
		if (!existsSync(dataDir)) {
			mkdirSync(dataDir, { recursive: true });
		}

		writeFileSync(Config.path, JSON.stringify(this.#data, null, 2));
	}

	get activeHost(): string | undefined {
		return this.#data.activeHost;
	}

	set activeHost(host: string) {
		if (!host || !this.#data.hosts[host]) {
			throw new Error("no such host");
		}

		this.#data = {
			...this.#data,
			activeHost: host,
		};

		this.save();
	}

	get hosts(): Record<string, Host> {
		return this.#data.hosts;
	}

	get session(): Session | undefined {
		try {
			return this.getActiveHost().session;
		} catch {
			return undefined;
		}
	}

	set session(value: Session | undefined) {
		const activeHost = this.getActiveHost();
		if (!activeHost || !this.activeHost) {
			throw new Error("no active host");
		}

		this.#data = {
			...this.#data,
			hosts: {
				...this.#data.hosts,
				[this.activeHost]: {
					...activeHost,
					session: value ? { ...value } : undefined,
				},
			},
		};

		this.save();
	}

	addHost(name: string, address: string) {
		this.#data = {
			...this.#data,
			hosts: {
				...this.#data.hosts,
				[name]: {
					address,
				},
			},
			activeHost: name,
		};

		this.save();
	}

	getActiveHost(): Host {
		const name = this.activeHost;
		if (!name) {
			throw new Error("no active host");
		}

		const host = this.#data.hosts[name];
		if (!host) {
			throw new Error("invalid active host");
		}

		return host;
	}

	toJSON() {
		return JSON.parse(JSON.stringify(this.#data, null, 2));
	}
}
