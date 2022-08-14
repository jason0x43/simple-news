<script context="module" type="ts">
  import type { GetFeedStatsResponse } from '../api/feedstats';
  import type {
    FeedGroupWithFeeds,
    GetFeedGroupsResponse
  } from '../api/feedgroups';
  import type { Load } from './__types/__layout';
  import { errorResponse, isErrorResponse } from '$lib/request';
  import type { GetFeedsResponse } from '../api/feeds';

  export const load: Load = async ({ session, fetch }) => {
    const user = session.user;
    if (!user) {
      return {
        status: 302,
        redirect: '/login'
      };
    }

    const feedStatsResp = await fetch('/api/feedstats');
    const feedStats = (await feedStatsResp.json()) as GetFeedStatsResponse;
    if (isErrorResponse(feedStats)) {
      return errorResponse(feedStats.errors);
    }

    const feedGroupsResp = await fetch('/api/feedgroups');
    const feedGroups = (await feedGroupsResp.json()) as GetFeedGroupsResponse;
    if (isErrorResponse(feedGroups)) {
      return errorResponse(feedGroups.errors);
    }

    const feedsResp = await fetch('/api/feeds');
    const feeds = (await feedsResp.json()) as GetFeedsResponse;
    if (isErrorResponse(feeds)) {
      return errorResponse(feeds.errors);
    }

    return {
      props: {
        data: {
          feedStats,
          feeds,
          feedGroups
        }
      }
    };
  };
</script>

<script type="ts">
  import Header from '$lib/components/Header.svelte';
  import FeedsList from '$lib/components/FeedsList.svelte';
  import Select from '$lib/components/Select.svelte';
  import type { Feed } from '@prisma/client';
  import type { FeedStats } from '$lib/db/feed';
  import { slide } from '$lib/transition';
  import {
    sidebarVisible,
    feeds,
    feedGroups,
    feedStats,
    selectedFeedIds
  } from '$lib/stores';
  import { onMount } from 'svelte';
  import { invalidate } from '$app/navigation';
  import { setReaderContext } from '$lib/contexts';
  import ManageFeeds from '$lib/components/ManageFeeds.svelte';
  import { session } from '$app/stores';
  import { clearStorage, loadValue, storeValue } from '$lib/util';
  import type { UpdateSessionRequest } from '../api/session';
  import { browser } from '$app/env';
  import { put } from '$lib/request';

  export let data: {
    // selectedFeedIds: Feed['id'][] | undefined;
    feedStats: FeedStats;
    feeds: Feed[];
    feedGroups: FeedGroupWithFeeds[];
  };

  $: {
    $feeds = data.feeds;
    $feedStats = data.feedStats;
    $feedGroups = data.feedGroups;
  }

  let sbVisible = !selectedFeedIds;
  let managingFeeds = false;
  const titleListeners = new Set<() => void>();

  function handleTitlePress() {
    titleListeners.forEach((listener) => listener());
  }

  function toggleSidebar() {
    sbVisible = !sbVisible;
    if (sbVisible) {
      $sidebarVisible = true;
    }
  }

  function handleSidebarClose() {
    $sidebarVisible = false;
  }

  function onTitlePress(listener: () => void) {
    titleListeners.add(listener);
    return () => {
      titleListeners.delete(listener);
    };
  }

  setReaderContext({
    onTitlePress
  });

  if (browser) {
    session.subscribe(({ data }) => {
      put<UpdateSessionRequest>('/api/session', data).catch((error) => {
        console.warn('Error updating session data:', error);
      });
    });
  }

  onMount(() => {
    const interval = setInterval(() => {
      invalidate('/api/feedstats');
      invalidate((url) => /^\/api\/articles\?/.test(url));
      invalidate((url) => /^\/reader\/[^/]+/.test(url));
    }, 600_000);

    const activeSession = loadValue<string>('activeSession');
    if (activeSession !== $session.id) {
      clearStorage();
      storeValue('activeSession', $session.id);
    }

    return () => {
      clearInterval(interval);
    };
  });
</script>

<div class="header">
  <Header onTitlePress={handleTitlePress} {toggleSidebar} />
</div>

<div class="content">
  {#if sbVisible}
    <div
      class="sidebar"
      in:slide={{ direction: 'right' }}
      out:slide={{ direction: 'right' }}
      on:outroend={handleSidebarClose}
    >
      <div class="sidebar-feeds">
        <FeedsList
          articleFilter={$session.data.articleFilter}
          onSelect={() => (sbVisible = false)}
        />
      </div>
      <div class="sidebar-controls">
        <button on:click={() => (managingFeeds = true)}>Manage Feeds</button>
        <Select bind:value={$session.data.articleFilter}>
          <option value="unread">Unread</option>
          <option value="all">All</option>
          <option value="saved">Saved</option>
        </Select>
      </div>
    </div>
  {/if}

  <slot />

  {#if managingFeeds}
    <ManageFeeds onClose={() => (managingFeeds = false)} />
  {/if}
</div>

<style>
  .header {
    background: var(--matte);
    position: relative;
    z-index: 1;
  }

  .content {
    height: 100%;
    max-width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    background: var(--background);
  }

  .sidebar {
    background: var(--highlight);
    color: var(--highlight-text);
    width: var(--sidebar-width);
    display: flex;
    height: 100%;
    flex-direction: column;
    position: absolute;
    left: 0;
    z-index: 30;
  }

  .sidebar-feeds {
    flex-grow: 1;
    flex-shrink: 1;
    overflow: auto;
  }

  .sidebar-controls {
    flex-grow: 0;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    margin: 1rem;
    margin-top: 0.5rem;
    gap: var(--gap);
  }
</style>
