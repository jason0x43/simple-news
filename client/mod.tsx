import { React, ReactDOM } from "./deps.ts";
import App, { AppProps } from "./components/App.tsx";

type GlobaThisType = typeof globalThis & { appProps?: AppProps };

ReactDOM.hydrate(
  <App {...(globalThis as GlobaThisType).appProps} />,
  // @ts-ignore: document is undefined in deno
  document.getElementById("root"),
);
