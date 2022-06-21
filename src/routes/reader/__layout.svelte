<script context="module" type="ts">
  import type { Load } from '@sveltejs/kit';

  export const load: Load = async ({ session, params, fetch }) => {
    const user = session.user;
    if (!user) {
      return {
        status: 302,
        redirect: '/login'
      };
    }

    const feedStatsResp = await fetch('/api/feedstats');
    const feedStats: FeedStats = await feedStatsResp.json();

    let selectedFeedIds: Feed['id'][] | undefined;

    const feedOrGroupId = params.feedId;
    if (feedOrGroupId) {
      const [type, id] = feedOrGroupId.split('-');
      if (type === 'group') {
        const group = user.feedGroups.find((group) => group.id === id);
        selectedFeedIds = group?.feeds.map(({ feed: { id } }) => id) ?? [];
      } else {
        const feeds = getFeedsFromUser(user);
        const feed = feeds.find((feed) => feed.id === id);
        selectedFeedIds = feed ? [feed.id] : [];
      }
    }

    return {
      props: {
        user,
        selectedFeedIds,
        feedStats
      }
    };
  };
</script>

<script type="ts">
  import Header from '$lib/components/Header.svelte';
  import FeedsList from '$lib/components/FeedsList.svelte';
  import Select from '$lib/components/Select.svelte';
  import type { Feed } from '@prisma/client';
  import type { UserWithFeeds } from '$lib/db/user';
  import { getFeedsFromUser } from '$lib/util';
  import type { FeedStats } from '$lib/db/feed';
  import { slide } from '$lib/transition';
  import { articleFilter, sidebarVisible } from '$lib/stores';
  import { onMount } from 'svelte';
  import { invalidate } from '$app/navigation';
  import { setReaderContext } from '$lib/contexts';
  import ManageFeeds from '$lib/components/ManageFeeds.svelte';

  export let user: UserWithFeeds;
  export let selectedFeedIds: Feed['id'][] | undefined;
  export let feedStats: FeedStats;

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

  onMount(() => {
    const interval = setInterval(() => {
      invalidate('/api/feedstats');
      invalidate((url) => /^\/reader\/[^/]+/.test(url));
    }, 600000);

    return () => {
      clearInterval(interval);
    };
  });
</script>

<div class="header">
  <Header {selectedFeedIds} onTitlePress={handleTitlePress} {toggleSidebar} />
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
          {user}
          {feedStats}
          articleFilter={$articleFilter}
          {selectedFeedIds}
          onSelect={() => (sbVisible = false)}
        />
      </div>
      <div class="sidebar-controls">
        <button on:click={() => (managingFeeds = true)}>Manage Feeds</button>
        <Select bind:value={$articleFilter}>
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
    z-index: 2;
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
