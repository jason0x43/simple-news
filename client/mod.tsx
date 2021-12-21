/// <reference lib="dom" />

import { React, ReactDOM } from "./deps.ts";
import App from "./App.tsx";
import "../global.ts";

ReactDOM.hydrate(
  <React.StrictMode>
    <App {...globalThis.__PRELOADED_STATE__} />
  </React.StrictMode>,
  document.getElementById("root"),
);

delete globalThis.__PRELOADED_STATE__;
