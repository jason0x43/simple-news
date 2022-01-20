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

// Connected websockets
const sockets: Set<WebSocket> = new Set();

let routerInit: { client: string; styles: string };
let initialReloadSent = false;

/**
 * Touch this file (to intiate a reload) if the styles change.
 */
async function watchStyles() {
  const watcher = Deno.watchFs(clientDir);
  let timer: number | undefined;
  let updateStyles = false;
  let updateApp = false;

  for await (const event of watcher) {
    if (event.paths.some((p) => /\.css$/.test(p))) {
      updateStyles = true;
    }

    if (event.paths.some((p) => /client\/mod.tsx$/.test(p))) {
      updateApp = true;
    }

    if (updateStyles || updateApp) {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        if (updateApp || sockets.size === 0) {
          // If the app code was updated or there are no connected sockets,
          // trigger a server reload
          Deno.run({ cmd: ["touch", __filename] });
        } else {
          // If only styles were updated _and_ we have sockets, only rebuild and
          // reload the styles
          routerInit.styles = await buildStyles();
          for (const sock of sockets) {
            sock.send("refreshStyles");
          }
        }
      }, 250);
    }
  }
}

async function buildClient(): Promise<string> {
  const emitOptions: Deno.EmitOptions = {
    bundle: "module",
    check: false,
    compilerOptions: {
      target: "esnext",
      inlineSourceMap: true,
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

  return files["deno:///bundle.js"];
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

export async function serve() {
  const [styles, client] = await Promise.all([buildStyles(), buildClient()]);
  routerInit = { styles, client };

  const router = createRouter(routerInit);
  const app = new Application<AppState>();
  const port = 8083;

  const appKey = Deno.env.get("SN_KEY");
  if (appKey) {
    app.keys = [appKey];
    log.debug("Set app key");
  }

  // Log requests
  app.use(async (ctx, next) => {
    log.info(`${ctx.request.method} ${ctx.request.url.pathname}`);
    await next();
  });

  // Connect live-reload websockets
  if (Deno.env.get("SN_MODE") === "dev") {
    app.use(async (ctx, next) => {
      if (ctx.request.url.pathname.endsWith("/refresh")) {
        const socket = ctx.upgrade();
        sockets.add(socket);
        socket.onclose = () => {
          sockets.delete(socket);
        };

        socket.onopen = () => {
          if (!initialReloadSent) {
            socket.send("refresh");
            initialReloadSent = true;
          }
        };
      }

      await next();
    });
  }

  // Add cookie data to the app state
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
  if (Deno.env.get("SN_MODE") === "dev") {
    promises.push(watchStyles());
  }

  await Promise.allSettled(promises);
}
