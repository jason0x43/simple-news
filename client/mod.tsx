import React from "react";
import ReactDOM from "react-dom";
import App from "./App.tsx";
import initReloader from "./reload.ts";
import "../global.ts";

ReactDOM.hydrate(
  <React.StrictMode>
    <App dehydratedState={globalThis.__DEHYDRATED_STATE__} />
  </React.StrictMode>,
  document.getElementById("root"),
);

delete globalThis.__DEHYDRATED_STATE__;

if (globalThis.__DEV__) {
  initReloader();
}
