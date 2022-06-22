<script type="ts">
  import type { Feed } from '@prisma/client';
  import type { FeedStats } from '$lib/db/feed';
  import type { ArticleFilter } from '$lib/types';
  import type { FeedGroupWithFeeds } from 'src/routes/api/feedgroups';

  export let feeds: Feed[];
  export let feedGroups: FeedGroupWithFeeds[];
  export let feedStats: FeedStats;
  export let articleFilter: ArticleFilter;
  export let selectedFeedIds: Feed['id'][] | undefined;
  export let onSelect: () => void;

  let expanded: { [title: string]: boolean } = {};

  function getArticleCount(
    feeds: Feed[],
    feedStats: FeedStats,
    articleFilter: ArticleFilter
  ): number {
    return feeds.reduce((acc, feed) => {
      const stats = feedStats[feed.id] ?? {};
      return (
        acc +
        (articleFilter === 'unread' ? stats.total - stats.read : stats.total)
      );
    }, 0);
  }

  function isSelected(feeds: Feed[], selected: Feed['id'][] | undefined) {
    if (!selected) {
      return false;
    }
    return feeds.every(({ id }) => selected.includes(id));
  }

  function getGroupFeeds(group: FeedGroupWithFeeds, feeds: Feed[]): Feed[] {
    const groupFeeds: Feed[] = [];
    for (const feedGroupFeed of group.feeds) {
      const feed = feeds.find(({ id }) => id === feedGroupFeed.feedId);
      if (feed) {
        groupFeeds.push(feed);
      }
    }
    return groupFeeds;
  }
</script>

<ul class="feeds">
  {#each feedGroups as group (group.name)}
    {@const groupFeeds = getGroupFeeds(group, feeds)}
    {#if getArticleCount(groupFeeds, feedStats, articleFilter) > 0}
      <li class:expanded={expanded[group.name]}>
        <div
          class="group"
          class:selected={isSelected(groupFeeds, selectedFeedIds)}
        >
          <span
            class="expander"
            on:click={() => {
              expanded = {
                ...expanded,
                [group.name]: !expanded[group.name]
              };
            }}
          />
          <a
            class="title"
            href={`/reader/group-${group.id}`}
            on:click={() => {
              // setSelectedFeeds(
              //   getFeedsFromGroup(group).map(({ id }) => id)
              // );
              onSelect?.();
            }}
          >
            {group.name}
          </a>
          {#if feedStats}
            <span class="Feeds-unread">
              {getArticleCount(groupFeeds, feedStats, articleFilter)}
            </span>
          {/if}
        </div>

        <ul>
          {#each groupFeeds as feed (feed.id)}
            {#if getArticleCount([feed], feedStats, articleFilter) > 0}
              <li
                class="feed"
                class:selected={isSelected([feed], selectedFeedIds)}
                on:click={() => {
                  onSelect?.();
                }}
              >
                <a href={`reader/feed-${feed.id}`} class="title">
                  {feeds?.find((f) => f.id === feed.id)?.title}
                </a>
                <div class="unread">
                  {(feedStats?.[feed.id].total ?? 0) -
                    (feedStats?.[feed.id].read ?? 0)}
                </div>
              </li>
            {/if}
          {/each}
        </ul>
      </li>
    {/if}
  {/each}
</ul>

<style>
  .feeds {
    list-style-type: none;
    padding: 1rem;
    margin: 0;
    --hpad: 0.5rem;
    --vpad: 0.25rem;
    --expander-width: 1rem;
  }

  .selected {
    background: rgba(255, 255, 255, 0.1);
  }

  .group,
  .feed {
    border-radius: var(--border-radius);
  }

  .expanded .selected {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  .expanded .selected:first-child {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }

  .feeds ul {
    list-style-type: none;
    padding: 0;
  }

  .feed {
    display: flex;
    flex-direction: row;
  }

  .group {
    display: flex;
    align-items: center;
  }

  .group > *,
  .feed > * {
    padding: var(--vpad) var(--hpad);
  }

  .feed {
    /* padding is size of expander + expander padding */
    padding-left: calc(var(--expander-width) + 2 * var(--hpad));
  }

  .expander::before {
    content: '▷';
    display: inline-block;
    flex-grow: 0;
    width: var(--expander-width);
  }

  .title {
    flex-grow: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  a.title {
    text-decoration: none;
    color: inherit;
  }

  .group,
  .feed {
    cursor: pointer;
  }

  .feeds ul {
    display: none;
  }

  .expanded ul {
    display: initial;
  }

  .expanded .expander::before {
    content: '▽';
  }

  @media (hover: hover) {
    .group:hover,
    .feed:hover {
      background: rgba(0, 0, 0, 0.1);
    }
  }
</style>
