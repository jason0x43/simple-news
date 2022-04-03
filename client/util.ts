import { Feed } from "../types.ts";

export type ClassName =
  | string
  | { [name: string]: boolean | undefined }
  | undefined;

export function className(...args: ClassName[]) {
  const names = new Set<string>();
  for (const arg of args) {
    if (arg) {
      if (typeof arg === "string") {
        names.add(arg);
      } else {
        for (const argName in arg) {
          if (arg[argName]) {
            names.add(argName);
          }
        }
      }
    }
  }
  return Array.from(names.values()).join(" ");
}

export function toObject<T, K extends keyof T>(objArr: T[], key: K) {
  const obj: { [prop: string]: T } = {};
  for (const entry of objArr) {
    const entryKey = entry[key] as unknown as string;
    obj[entryKey] = entry;
  }
  return obj;
}

export function loadValue<T = unknown>(
  name: string,
  defaultValue?: T,
): T | undefined {
  const store = globalThis.localStorage;
  const val = store.getItem(name);
  if (val === null) {
    return defaultValue;
  }
  return JSON.parse(val);
}

export function storeValue(name: string, value: unknown) {
  const store = globalThis.localStorage;

  if (value !== undefined) {
    store.setItem(name, JSON.stringify(value));
  } else {
    store.removeItem(name);
  }
}

export function removeValue(name: string) {
  const store = globalThis.localStorage;
  store.removeItem(name);
}

export function preloadFeedIcons(feeds: Feed[]) {
  const preloadIds: string[] = [];
  for (const link of document.head.querySelectorAll("link[data-preload-id]")) {
    preloadIds.push(link.getAttribute("data-preload-id") as string);
  }
  const faviconLinks = feeds?.filter((feed) =>
    feed.icon &&
    !preloadIds.includes(`${feed.id}`)
  ).map(({ id, icon }) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = icon as string;
    link.setAttribute("data-preload-id", `${id}`);
    return link;
  });

  for (const link of faviconLinks) {
    document.head.append(link);
  }
}
