import React from "react";
import ReactDOM from "react-dom";
import App from "./App.tsx";
import "../global.ts";

ReactDOM.hydrate(
  <React.StrictMode>
    <App initialState={globalThis.__INITIAL_STATE__} />
  </React.StrictMode>,
  document.getElementById("root"),
);

delete globalThis.__INITIAL_STATE__;
