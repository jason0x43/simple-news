import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import App from "./App.tsx";
import { createStore } from "./store/mod.ts";
import initReloader from "./reload.ts";

const store = createStore(globalThis.__PRELOADED_STATE__);

ReactDOM.hydrate(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById("root"),
);

delete globalThis.__PRELOADED_STATE__;

if (globalThis.__DEV__) {
  initReloader();
}
