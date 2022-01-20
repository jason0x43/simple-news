export default function initReloader() {
  let socket: WebSocket | undefined;
  let reconnectTimer: number | undefined;
  const url = `${window.location.origin.replace("http", "ws")}/refresh`;

  function connect() {
    if (socket) {
      socket.close();
    }

    socket = new WebSocket(url);

    socket.addEventListener("open", () => {
      console.log("live-reload socket connected");
    });

    socket.addEventListener("message", (event) => {
      if (event.data === "refreshStyles") {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "/styles.css";
        const existing = document.head.querySelector('link[rel="stylesheet"]')!;
        existing.replaceWith(link);
      } else if (event.data === "refresh") {
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
}
