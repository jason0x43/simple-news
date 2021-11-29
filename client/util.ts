export type ClassName = string | { [name: string]: boolean };

export function className(...args: ClassName[]) {
  const names = new Set<string>();
  for (const arg of args) {
    if (typeof arg === 'string') {
      names.add(arg);
    } else {
      for (const argName in arg) {
        if (arg[argName]) {
          names.add(argName);
        }
      }
    }
  }
  return Array.from(names.values()).join(' ');
}
