import { Application } from "oak";
import * as log from "std/log/mod.ts";
import * as path from "std/path/mod.ts";
import { expandGlob } from "std/fs/mod.ts";
import type { AppState } from "./types.ts";
import { createRouter, type RouterConfig } from "./routes.tsx";
import { refreshFeeds } from "./feed.ts";
import { addSessionMiddleware, addUserDataMiddleware } from "./sessions.ts";

export type ServerConfig = {
  devMode?: boolean;
  port?: number;
};

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

// The path to the client files relative to the proect root
const clientDir = path.join(__dirname, "..", "client");

// Refresh interval in seconds
const refreshInterval = 600;

let routerConfig: RouterConfig;

/**
 * Watch for file changes
 */
async function watchFiles(
  updateStyles: (newStyles: string) => void,
) {
  const watcher = Deno.watchFs(clientDir);
  let timer: number | undefined;

  for await (const event of watcher) {
    if (event.paths.some((p) => /\.css$/.test(p))) {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        log.debug('Updating styles');
        updateStyles(await buildStyles());
      }, 250);
    } else if (event.paths.some((p) => /client\/mod.tsx$/.test(p))) {
      // client/mod.tsx isn't in the import graph of mod, so we need to manually
      // trigger a restart if it changes
      Deno.run({ cmd: ["touch", __filename] });
    }
  }
}

async function buildClient(config: ServerConfig): Promise<string> {
  const emitOptions: Deno.EmitOptions = {
    bundle: "module",
    check: false,
    importMapPath: path.join(__dirname, "..", "import_map.json"),
    compilerOptions: {
      target: "esnext",
      lib: ["dom", "dom.iterable", "dom.asynciterable", "deno.ns"],
    },
  };

  if (config.devMode) {
    emitOptions.compilerOptions!.inlineSourceMap = true;
    emitOptions.importMapPath = path.join(
      __dirname,
      "..",
      "import_map_dev.json",
    );
  }

  // Build and cache the client code
  const { files, diagnostics } = await Deno.emit(
    path.join(clientDir, "mod.tsx"),
    emitOptions,
  );

  if (diagnostics.length > 0) {
    log.warning(Deno.formatDiagnostics(diagnostics));
  }

  const bundle = files["deno:///bundle.js"];

  const formatter = new Intl.NumberFormat("en-US");
  log.debug(`Bundle is ${formatter.format(bundle.length)} bytes`);

  return bundle;
}

async function buildStyles(): Promise<string> {
  // Build and cache the styles
  let styles = "";
  for await (
    const entry of expandGlob(
      path.join(__dirname, "..", "client", "**", "*.css"),
    )
  ) {
    const text = await Deno.readTextFile(entry.path);
    styles += `${text}\n`;
  }

  return styles;
}

export async function serve(config: ServerConfig) {
  const { devMode } = config;

  const [styles, client] = await Promise.all([
    buildStyles(),
    buildClient(config),
  ]);
  routerConfig = { styles, client, dev: devMode };

  const { router, updateStyles } = createRouter(routerConfig);
  const app = new Application<AppState>();
  const port = config.port ?? 8083;

  // Log requests
  app.use(async (ctx, next) => {
    log.info(`${ctx.request.method} ${ctx.request.url.pathname}`);
    await next();
  });

  // Add cookie data to the app state
  addSessionMiddleware(app);
  addUserDataMiddleware(app);

  app.use(router.routes());
  app.use(router.allowedMethods());

  // serve assets in the public directory
  app.use(async (ctx) => {
    await ctx.send({
      root: path.join(__dirname, "..", "public"),
    });
  });

  // Do an update every 10 minutes
  setInterval(() => {
    refreshFeeds();
  }, refreshInterval * 1000);
  log.info(`Downloading feeds every ${refreshInterval} seconds`);

  log.info(`Listening on port ${port}`);

  const promises = [app.listen({ port })];
  if (devMode) {
    promises.push(watchFiles(updateStyles));
  }

  await Promise.allSettled(promises);
}
