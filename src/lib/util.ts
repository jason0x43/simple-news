import type { Feed } from '@prisma/client';
import type { FeedGroupWithFeeds } from './db/feedgroup';
import type { UserWithFeeds } from './db/user';
import { ResponseError } from './error';

/**
 * Make a POST request
 */
export async function post<T = unknown, R = unknown>(
  path: string,
  data: T
): Promise<R> {
  const resp = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(data),
    headers: {
      'content-type': 'application/json'
    }
  });
  if (resp.status >= 400) {
    const body = await resp.text();
    throw new ResponseError('POST', path, resp.status, resp.statusText, body);
  }
  return (await resp.json()) as R;
}

/**
 * Make a PUT request
 */
export async function put<T = unknown, R = unknown>(
  path: string,
  data: T
): Promise<R> {
  const resp = await fetch(path, {
    method: 'PUT',
    credentials: 'include',
    body: JSON.stringify(data),
    headers: {
      'content-type': 'application/json'
    }
  });
  if (resp.status >= 400) {
    const body = await resp.text();
    throw new ResponseError('PUT', path, resp.status, resp.statusText, body);
  }
  return (await resp.json()) as R;
}

export async function fetchData<T>(url: string): Promise<T> {
  const resp = await fetch(url);
  return (await resp.json()) as T;
}

export function getQueryParam(params: URLSearchParams, key: string): string {
  const val = params.get(key);
  if (val === null) {
    throw new Error(`Missing required param ${key}`);
  }
  return val;
}

export function getFeedsFromGroup(group: FeedGroupWithFeeds): Feed[] {
  const feeds = [];
  for (const groupFeed of group.feeds) {
    feeds.push(groupFeed.feed);
  }
  return feeds;
}

export function getFeedsFromUser(user: UserWithFeeds): Feed[] {
  const feeds = [];
  for (const group of user.feedGroups) {
    feeds.push(...getFeedsFromGroup(group));
  }
  return feeds;
}

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
