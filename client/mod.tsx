import React from "react";
import { hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import "../global.ts";

hydrateRoot(
  document.getElementById("root") as Element,
  <React.StrictMode>
    <App initialState={globalThis.__INITIAL_STATE__} />
  </React.StrictMode>,
);

delete globalThis.__INITIAL_STATE__;
