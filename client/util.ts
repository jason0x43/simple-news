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
