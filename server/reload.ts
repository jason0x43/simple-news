import { AppState } from "./types.ts";
import { Application, Router } from "oak";

export function addLiveReloadMiddleware(app: Application<AppState>) {
  // Connected websockets
  const sockets: Set<WebSocket> = new Set();
  let initialReloadSent = false;

  app.state.sockets = sockets;

  app.use(async (ctx, next) => {
    if (ctx.request.url.pathname.endsWith("/livereload")) {
      const socket = ctx.upgrade();
      sockets.add(socket);
      socket.onclose = () => {
        sockets.delete(socket);
      };

      socket.onopen = () => {
        if (!initialReloadSent) {
          socket.send("reload");
          initialReloadSent = true;
        }
      };
    }

    await next();
  });

  return (message: string) => {
    for (const sock of sockets) {
      sock.send(message);
    }
  };
}

export function addLiveReloadRoute(router: Router<AppState>) {
  router.get("/livereload", ({ response }) => {
    response.status = 200;
  });
}
