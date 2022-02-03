import yargs from "yargs/deno.ts";
export { yargs };

import { Arguments } from "yargs/deno-types.ts";
export type { Arguments };

type Yargs = ReturnType<typeof yargs>;
export type { Yargs };

export * as log from "std/log/mod.ts";
