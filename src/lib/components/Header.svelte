<script type="ts">
  import type { Feed } from '@prisma/client';
  import { page } from '$app/stores';
  import type { FeedGroupWithFeeds } from '$lib/db/feedgroup';
  import UserIcon from '$lib/icons/User.svelte';
  import RssIcon from '$lib/icons/Rss.svelte';

  export let selectedFeedIds: Feed['id'][] | undefined;
  export let onTitlePress: () => void;
  export let toggleSidebar: () => void;

  let title = '';

  $: {
    const { feeds, feedGroups } = $page.stuff;
    title = getFeedsTitle(feedGroups, feeds, selectedFeedIds);
  }

  function getFeedsTitle(
    feedGroups: FeedGroupWithFeeds[] | undefined,
    feeds: Feed[] | undefined,
    selectedFeedIds: string[] | undefined
  ): string {
    if (
      !selectedFeedIds ||
      selectedFeedIds.length === 0 ||
      !feeds ||
      !feedGroups
    ) {
      return '';
    }

    if (selectedFeedIds.length === 1) {
      for (const feed of feeds) {
        if (feed.id === selectedFeedIds[0]) {
          return feed.title;
        }
      }
    } else if (selectedFeedIds.length > 1) {
      for (const group of feedGroups) {
        for (const groupFeed of group.feeds) {
          if (groupFeed.feedId === selectedFeedIds[0]) {
            return group.name;
          }
        }
      }
    }

    return '';
  }
</script>

<header class="header">
  <div class="left" on:click={toggleSidebar}>
    <RssIcon size="22px" />
    <h1>Simple News</h1>
  </div>
  <div class="center">
    <h2 on:click={onTitlePress}>{title}</h2>
  </div>
  <div class="right">
    <a class="user" href="/auth/logout">
      <UserIcon size={20} />
    </a>
  </div>
</header>

<style>
  .header {
    display: grid;
    grid-template-columns: min-content 1fr min-content;
    align-items: center;
    border-bottom: solid 1px var(--border);
    user-select: none;
    -webkit-user-select: none;
  }

  .left {
    display: flex;
    align-items: center;
    padding: calc(var(--side-pad) / 2) var(--side-pad);
    gap: 0.25rem;
    cursor: pointer;
  }

  .left h1 {
    margin: 0;
    padding: 0;
    font-size: calc(var(--font-size) * 1.25);
    white-space: nowrap;
  }

  .center {
    justify-content: center;
    display: flex;
    flex-direction: row;
    overflow: hidden;
    gap: 0.5rem;
  }

  .center h2 {
    font-size: var(--font-size);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin: 0;
    cursor: pointer;
  }

  .right {
    justify-self: right;
    padding: calc(var(--side-pad) / 2) var(--side-pad);
  }

  .user {
    cursor: pointer;
    text-decoration: none;
    color: inherit;
    display: flex;
    align-items: center;
  }
</style>
