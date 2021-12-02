import { Application, log, path } from "./deps.ts";
import { createRouter } from "./routes.tsx";

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

// The path to the client files relative to the proect root
const clientDir = path.join(__dirname, "..", "client");

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
  // Build and cache the client code
  const { files, diagnostics } = await Deno.emit(
    path.join(clientDir, "mod.tsx"),
    { bundle: "module" },
  );

  if (diagnostics.length > 0) {
    for (const diag of diagnostics) {
      log.warning(diag.messageText);
    }
  }

  const router = createRouter({
    path: "/client.js",
    text: files["deno:///bundle.js"],
  });

  const port = 8083;
  const app = new Application();

  app.use(async (ctx, next) => {
    await next();
    log.info(`${ctx.request.method} ${ctx.request.url.pathname}`);
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  app.use(async (ctx) => {
    await ctx.send({
      root: path.join(__dirname, "..", "public"),
    });
  });

  log.info(`Listening on port ${port}`);

  await Promise.allSettled([app.listen({ port }), watchClient()]);
}
