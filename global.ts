import { AppProps } from "./client/App.tsx";

declare global {
  // deno-lint-ignore no-var
  var __INITIAL_STATE__: AppProps["initialState"] | undefined;
}

function toString(value: unknown): string {
  return JSON.stringify(value ?? null).replace(/</g, "\\u003c");
}

export function getGlobalStateStatement(
  initialState: AppProps["initialState"],
) {
  return `globalThis.__INITIAL_STATE__ = ${toString(initialState)};`;
}
