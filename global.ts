import type { DehydratedState } from "react-query";

declare global {
  // deno-lint-ignore no-var
  var __DEHYDRATED_STATE__: DehydratedState | undefined;
  // deno-lint-ignore no-var
  var __DEV__: boolean | undefined;
}

function toString(value: unknown): string {
  return JSON.stringify(value ?? null).replace(/</g, "\\u003c");
}

export function getDehydratedStateStatement(state: DehydratedState) {
    return `globalThis.__DEHYDRATED_STATE__ = ${toString(state)};`;
}
