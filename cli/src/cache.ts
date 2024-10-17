import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { z } from "zod";

const cacheFile = `${process.env.HOME}/.cache/sn-cli/cache.json`;

const constructorKey = Symbol();

const CacheData = z.object({
	/** A mapping of types (e.g., feeds) to lists of ids */
	ids: z.record(z.string(), z.array(z.string())),
});

type CacheData = z.infer<typeof CacheData>;

type IdType = "feed";

export class Cache {
	static load(): Cache {
		try {
			const data = readFileSync(cacheFile, "utf-8");
			const cache = CacheData.parse(JSON.parse(data));
			return new Cache(constructorKey, cache);
		} catch {
			return new Cache(constructorKey, { ids: {} });
		}
	}

	#data: CacheData;

	private constructor(key: symbol, data: CacheData) {
		if (key !== constructorKey) {
			throw new Error("use Config.load() to create a Config instance");
		}
		this.#data = data;
	}

	getMatchingId(type: IdType, id: string): string {
		const matches: string[] = [];
		for (const i of this.#data.ids[type]) {
			if (i.startsWith(id)) {
				matches.push(i);
			}
		}
		if (matches.length > 1) {
			throw new Error("Multiple matching IDs found");
		}
		if (matches.length === 0) {
			throw new Error("No matching ID found");
		}
		return matches[0];
	}

	addId(type: IdType, id: string) {
		if (!this.#data.ids[type]) {
			this.#data.ids[type] = [];
		}
		if (!this.#data.ids[type].includes(id)) {
			this.#data.ids[type].push(id);
			this.save();
		}
	}

	save() {
		if (!existsSync(dirname(cacheFile))) {
			mkdirSync(dirname(cacheFile), { recursive: true });
		}
		writeFileSync(cacheFile, JSON.stringify(this.#data), "utf-8");
	}
}
