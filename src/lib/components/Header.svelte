<script type="ts">
  import type { FeedGroupWithFeeds } from '$lib/db/feedgroup';
  import UserIcon from '$lib/icons/User.svelte';
  import RssIcon from '$lib/icons/Rss.svelte';
  import { getAppContext } from '$lib/contexts';
  import type { Feed } from '$lib/db/schema';
  import Button from './Button.svelte';
  import Link from './Link.svelte';

  export let onTitlePress: () => void;

  const { feeds, feedGroups, selectedFeedIds, sidebarVisible } =
    getAppContext().stores;

  $: title = getFeedsTitle($feedGroups, $feeds, $selectedFeedIds);

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
          if (groupFeed.id === selectedFeedIds[0]) {
            return group.name;
          }
        }
      }
    }

    return '';
  }

  function toggleSidebar() {
    $sidebarVisible = !$sidebarVisible;
  }
</script>

<header class="header">
  <Button
    disabled={$selectedFeedIds.length === 0}
    type="invisible"
    on:click={(event) => {
      toggleSidebar();
      event.stopPropagation();
    }}
  >
    <div class="left">
      <RssIcon size="22px" />
      <h1>Simple News</h1>
    </div>
  </Button>
  <div class="center">
    <Button type="invisible" on:click={onTitlePress}>
      <h2>{title}</h2>
    </Button>
  </div>
  <div class="right">
    <Link type="invisible" href="/login">
      <UserIcon size={20} />
    </Link>
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

  /* Mobile */
  @media only screen and (max-width: 800px) {
    h1 {
      display: none;
    }
  }
</style>
