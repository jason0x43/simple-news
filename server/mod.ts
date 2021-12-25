import { Application, expandGlob, log, path } from "./deps.ts";
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
 * Touch this file (to intiate a reload) if the styles change.
 */
async function watchStyles() {
  const watcher = Deno.watchFs(clientDir);
  let timer: number | undefined;
  for await (const event of watcher) {
    if (
      event.paths.some((p) => /\.css$/.test(p) || /client\/mod.tsx$/.test(p))
    ) {
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

  const router = createRouter({
    client: files["deno:///bundle.js"],
    styles,
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

  app.use(async ({ cookies, state }, next) => {
    const userId = await cookies.get("userId");
    if (userId) {
      state.userId = Number(userId);
    }

    const selectedFeedsStr = await cookies.get("selectedFeeds");
    if (selectedFeedsStr) {
      state.selectedFeeds = selectedFeedsStr.split(",").map(Number);
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

  const promises = [app.listen({ port })];
  if (Deno.env.get("SN_MODE") === "dev") {
    promises.push(watchStyles());
  }

  await Promise.allSettled(promises);
}
