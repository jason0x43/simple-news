import { React, ReactDOM } from "./deps.ts";
import App from "./components/App.tsx";
import "../global.ts";

ReactDOM.hydrate(
  <App {...globalThis.__PRELOADED_STATE__} />,
  // @ts-ignore: document is undefined in deno
  document.getElementById("root"),
);

delete globalThis.__PRELOADED_STATE__;
