import type { FeedGroupWithFeeds, FeedStats } from 'server';
import { writable } from "svelte/store";

export const feedId = writable<string | undefined>();
export const feedStats = writable<FeedStats | undefined>();
export const feedGroups = writable<FeedGroupWithFeeds | undefined>();
export const sidebarVisible = writable<boolean>(true);
