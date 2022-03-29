import { AppState } from "./types.ts";
import { Router } from "oak";

export function addLiveReloadRoute(
  router: Router<AppState>,
  setStyles: (newStyles: styles) => void,
) {
  const buildId = crypto.randomUUID();
  const sockets = new Set<WebSocket>();

  router.get("/livereload/:id", (ctx) => {
    const id = ctx.params.id;
    const socket = ctx.upgrade();
    sockets.add(socket);
    socket.onclose = () => {
      sockets.delete(socket);
    };
    socket.onopen = () => {
      if (id !== buildId) {
        socket.send("reload");
      }
    };
  });

  // Injected into the client to allow live-reloading
  const liveReloadSnippet = `
    <script type="module">
      function connect() {
        const url = window.location.origin.replace("http", "ws")
          + '/livereload/${buildId}';
        const socket = new WebSocket(url);
        let reconnectTimer;

        socket.addEventListener("open", () => {
          console.log("live-reload socket connected");
        });

        socket.addEventListener("message", (event) => {
          if (event.data === "loadStyles") {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "/styles.css";
            const existing = document.head.querySelector('link[rel="stylesheet"]');
            existing.replaceWith(link);
          } else if (event.data === "reload") {
            window.location.reload();
          }
        });

        socket.addEventListener("close", () => {
          console.log("reconnecting live-reload socket...");
          clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(() => {
            connect();
          }, 1000);
        });
      }

      connect();
    </script>
  `;

  const updateStyles = (newStyles: string) => {
    setStyles(newStyles);
    for (const socket of sockets) {
      socket.send("refreshStyles");
    }
  };

  return {
    liveReloadSnippet,
    updateStyles
  };
}
