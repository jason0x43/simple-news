export function unescapeHtml(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

export function isDefined<T>(val: T): val is NonNullable<T> {
  return Boolean(val);
}

export function uniquify<T>(val: T[]): T[] {
  return Array.from(new Set(val));
}

export function loadValue<T>(key: string): T | undefined {
  const val = window.sessionStorage.getItem(key);
  if (val) {
    return JSON.parse(val);
  }
  return undefined;
}

export function storeValue<T>(key: string, value: T): void {
  window.sessionStorage.setItem(`simple-news:${key}`, JSON.stringify(value));
}

export function clearValue(key: string): void {
  window.sessionStorage.removeItem(`simple-news:${key}`);
}

export function clearStorage(): void {
  const keys: string[] = [];
  for (let i = 0; i < window.sessionStorage.length; i++) {
    keys.push(window.sessionStorage.key(i) as string);
  }
  const appKeys = keys.filter((k) => /^simple-news:/.test(k));
  for (const key of appKeys) {
    window.sessionStorage.removeItem(key);
  }
}
