<script context="module" type="ts">
  import type { Load } from './__types/__layout';
  import { isRequestOutput } from '$lib/request';
  import { loadData } from './_util';

  export const load: Load = async ({ session, fetch }) => {
    const user = session.user;
    if (!user) {
      return {
        status: 302,
        redirect: '/login'
      };
    }

    const result = await loadData(fetch);

    if (isRequestOutput(result)) {
      return result;
    }

    const { feedGroups, feedStats, feeds } = result;

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
  import type { FeedStats } from '$lib/db/feed';
  import { onMount } from 'svelte';
  import { invalidate } from '$app/navigation';
  import { getAppContext, setReaderContext } from '$lib/contexts';
  import ManageFeeds from '$lib/components/ManageFeeds.svelte';
  import { clearStorage, loadValue, storeValue } from '$lib/util';
  import type { UpdateSessionRequest } from '../api/session';
  import { browser } from '$app/env';
  import { session } from '$app/stores';
  import { put } from '$lib/request';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import type { Feed } from '$lib/db/schema';
  import type { FeedGroupWithFeeds } from '$lib/db/feedgroup';

  export let data: {
    // selectedFeedIds: Feed['id'][] | undefined;
    feedStats: FeedStats;
    feeds: Feed[];
    feedGroups: FeedGroupWithFeeds[];
  };

  const { sidebarVisible, feeds, feedGroups, feedStats, managingFeeds } =
    getAppContext().stores;

  $: {
    $feeds = data.feeds;
    $feedStats = data.feedStats;
    $feedGroups = data.feedGroups;
  }

  const titleListeners = new Set<() => void>();

  function handleTitlePress() {
    titleListeners.forEach((listener) => listener());
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
      // Clear storage if there's data from an old session
      if (activeSession) {
        clearStorage();
      }
      storeValue('activeSession', $session.id);
    }

    return () => {
      clearInterval(interval);
    };
  });
</script>

<div class="header">
  <Header onTitlePress={handleTitlePress} />
</div>

<div class="content">
  {#if $sidebarVisible}
    <Sidebar />
  {/if}

  <slot />

  {#if $managingFeeds}
    <ManageFeeds />
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
</style>
