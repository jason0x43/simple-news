import { Application, log, path } from "./deps.ts";
import { AppState } from "../types.ts";
import { createRouter } from "./routes.tsx";
import { refreshFeeds } from "./feed.ts";

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

// The path to the client files relative to the proect root
const clientDir = path.join(__dirname, "..", "client");

// Refresh interval in seconds
const refreshInterval = 600;

/**
 * Touch this file (to intiate a reload) if the client code changes.
 */
async function watchClient() {
  const watcher = Deno.watchFs(clientDir);
  let timer: number | undefined;
  for await (const event of watcher) {
    if (event.paths.some((p) => /\.tsx?/.test(p))) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        Deno.run({ cmd: ["touch", __filename] });
      }, 250);
    }
  }
}

export async function serve() {
  const emitOptions: Deno.EmitOptions = {
    bundle: "module",
    check: false,
    compilerOptions: {
      target: "esnext",
      lib: ["dom", "dom.iterable", "dom.asynciterable", "deno.ns"],
    },
  };

  const importMap = Deno.env.get("SN_IMPORT_MAP");
  if (importMap) {
    emitOptions.importMapPath = path.join(__dirname, "..", importMap);
  }

  // Build and cache the client code
  const { files, diagnostics } = await Deno.emit(
    path.join(clientDir, "mod.tsx"),
    emitOptions,
  );

  if (diagnostics.length > 0) {
    log.warning(Deno.formatDiagnostics(diagnostics));
  }

  const router = createRouter({
    path: "/client.js",
    text: files["deno:///bundle.js"],
  });

  const port = 8083;
  const app = new Application<AppState>();

  const appKey = Deno.env.get("SN_KEY");
  if (appKey) {
    app.keys = [appKey];
    log.debug("Set app key");
  }

  app.use(async (ctx, next) => {
    log.info(`${ctx.request.method} ${ctx.request.url.pathname}`);
    await next();
  });

  app.use(async (ctx, next) => {
    const userId = await ctx.cookies.get("userId");
    if (userId) {
      ctx.state.userId = Number(userId);
    }
    await next();
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

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
  await Promise.allSettled([app.listen({ port }), watchClient()]);
}
