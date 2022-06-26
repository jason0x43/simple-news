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
  const val = localStorage.getItem(key);
  if (val) {
    return JSON.parse(val);
  }
  return undefined;
}

export function storeValue<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function clearValue(key: string): void {
  localStorage.removeItem(key);
}
