import type { SvelteComponentTyped } from 'svelte';

export type ArticleFilter = 'all' | 'unread' | 'saved';

export type Props<T> = T extends SvelteComponentTyped<
  infer P,
  Record<string, unknown>,
  Record<string, unknown>
>
  ? P
  : never;
