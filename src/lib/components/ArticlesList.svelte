<script type="ts">
  import { page, session } from '$app/stores';
  import type { Article, Feed } from '@prisma/client';
  import ContextMenu from './ContextMenu.svelte';
  import { getAge } from '$lib/date';
  import type { ArticleHeadingWithUserData } from '$lib/db/article';
  import {
    clearValue,
    loadValue,
    storeValue,
    unescapeHtml,
    uniquify
  } from '$lib/util';
  import { invalidate } from '$app/navigation';
  import type {
    ArticleUpdateRequest,
    ArticleUpdateResponse
  } from 'src/routes/api/articles';
  import { onMount } from 'svelte';
  import { put } from '$lib/request';
  import { getAppContext } from '$lib/contexts';

  const { articles, feeds, sidebarVisible } = getAppContext().stores;

  type ScrollData = { visibleCount: number; scrollTop: number };
  const updatedArticleIds = new Set<Article['id']>();
  const scrollDataKey = 'scrollData';

  $: selectedFeed = $page.params.feedId;
  $: selectedArticleId = $page.params.articleId;
  $: articleFeedIds = uniquify(
    $articles?.slice(0, 40).map(({ feedId }) => feedId) ?? []
  );
  $: icons = $feeds
    .filter(({ id }) => articleFeedIds.includes(id))
    .map(({ icon }) => icon);

  let visibleCount = 40;
  let scrollBox: HTMLElement | undefined;
  let prevFeed = selectedFeed;

  $: {
    if (prevFeed !== selectedFeed) {
      // reset state when selected feed changes (but not when it's first
      // initialized)
      if (prevFeed && selectedFeed) {
        updatedArticleIds.clear();
        clearValue(scrollDataKey);
        visibleCount = 40;
        scrollBox?.scrollTo(0, 0);
      }
      prevFeed = selectedFeed;
    }
  }

  $: {
    if (selectedArticleId) {
      updatedArticleIds.add(selectedArticleId);
      if (!$articles?.find(({ id }) => id === selectedArticleId)?.read) {
        markAsRead([selectedArticleId], true);
      }
    }
  }

  let menuAnchor: { x: number; y: number } | undefined;
  let activeArticleId: Article['id'] | undefined;
  let filteredArticles: ArticleHeadingWithUserData[] = [];
  let renderedArticles: (ArticleHeadingWithUserData & {
    feed: Feed | undefined;
    isActive: boolean;
    isSelected: boolean;
    isRead: boolean;
  })[] = [];

  $: {
    // Don't update the articles list until the sidebar has finished sliding
    // out of view
    if (!$sidebarVisible) {
      if (!articles) {
        // there are no articles
        filteredArticles = [];
      } else if ($session.data.articleFilter === 'all') {
        // show all articles
        filteredArticles = $articles ?? [];
      } else if ($session.data.articleFilter === 'saved') {
        // show saved articles
        filteredArticles = $articles?.filter(({ saved }) => saved) ?? [];
      } else {
        // show unread (and recently updated) articles
        filteredArticles =
          $articles?.filter(
            ({ id, read }) =>
              !read || updatedArticleIds.has(id) || id === selectedArticleId
          ) ?? [];
      }
    }
  }

  $: {
    renderedArticles = filteredArticles
      .slice(0, visibleCount)
      .map((article) => ({
        ...article,
        feed: $feeds.find(({ id }) => id === article.feedId),
        isActive: activeArticleId === article.id,
        isSelected: selectedArticleId === article.id,
        isRead: article.read ?? false
      }));
  }

  let scrollTimer: ReturnType<typeof setTimeout>;

  function handleListScroll(event: Event) {
    const target = event.target as HTMLDivElement;
    const { clientHeight, scrollHeight, scrollTop } = target;
    // Load 20 new articles when we've gotten within 500 pixels of the end of
    // the list
    const remaining = scrollHeight - (scrollTop + clientHeight);
    if (remaining < 500 && visibleCount < filteredArticles.length) {
      const newCount = Math.min(visibleCount + 20, filteredArticles.length);
      visibleCount = newCount;
    }

    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      storeValue<ScrollData>(scrollDataKey, {
        visibleCount,
        scrollTop
      });
    }, 500);
  }

  function handleContextMenu(event: {
    target: EventTarget | null;
    x: number;
    y: number;
    preventDefault?: () => void;
  }) {
    let target = event.target as HTMLElement | null;
    while (target && !target.hasAttribute('data-id')) {
      target = target.parentElement;
    }

    if (target) {
      activeArticleId = target.getAttribute('data-id') as string;
      menuAnchor = { x: event.x, y: event.y };
      event.preventDefault?.();
    }
  }

  let touchTimer: ReturnType<typeof setTimeout>;

  function handleTouchStart(event: TouchEvent) {
    const { pageX, pageY } = event.touches[0];
    touchTimer = setTimeout(() => {
      handleContextMenu({
        target: event.target,
        x: pageX,
        y: pageY
      });
    }, 500);
  }

  function handleTouchEnd() {
    clearTimeout(touchTimer);
  }

  function handleContextSelect(value: string) {
    const read = !/unread/.test(value);
    let ids: Article['id'][] | undefined;

    if (/above/.test(value)) {
      const idx = renderedArticles.findIndex(
        ({ id }) => id === activeArticleId
      );
      ids = renderedArticles.slice(0, idx).map(({ id }) => id);
    } else if (/below/.test(value)) {
      const idx = renderedArticles.findIndex(
        ({ id }) => id === activeArticleId
      );
      ids = renderedArticles.slice(idx + 1).map(({ id }) => id);
    } else if (activeArticleId) {
      ids = [activeArticleId];
    }

    if (ids) {
      for (const id of ids) {
        updatedArticleIds.add(id);
      }
      markAsRead(ids, read);
    }
  }

  function handleContextClose() {
    menuAnchor = undefined;
    activeArticleId = undefined;
  }

  async function markAsRead(articleIds: Article['id'][], read: boolean) {
    const updated: Article['id'][] = [];
    let data: ArticleUpdateResponse | undefined;

    // optimistically update articles
    if ($articles) {
      for (const id of articleIds) {
        const idx = $articles.findIndex((article) => article.id === id);
        if (idx !== -1 && $articles[idx].read !== read) {
          $articles[idx] = { ...$articles[idx], read };
          updated.push(id);
        }
      }
    }

    try {
      data = await put<ArticleUpdateRequest, ArticleUpdateResponse>(
        '/api/articles',
        {
          articleIds,
          userData: { read }
        }
      );
    } catch (error) {
      console.warn(`Error marking articles as read: ${error}`);

      // revert the optimistic update if the request failed
      if ($articles) {
        for (const id of updated) {
          const idx = $articles.findIndex((article) => article.id === id);
          if (idx !== -1) {
            $articles[idx] = { ...$articles[idx], read: !read };
          }
        }
      }
    }

    if (data?.articles) {
      invalidate('/api/feedstats');

      // update articles from returned data
      if ($articles) {
        for (const article of data.articles) {
          const idx = $articles.findIndex(({ id }) => id === article.id);
          if (idx !== -1) {
            $articles[idx] = article;
          }
        }
      }
    }
  }

  onMount(() => {
    const scrollData = loadValue<ScrollData>(scrollDataKey);
    if (scrollData) {
      visibleCount = scrollData.visibleCount;
      setTimeout(() => {
        scrollBox?.scrollTo({ top: scrollData.scrollTop });
      });
    }
  });
</script>

<svelte:head>
  {#each icons as icon}
    <link rel="preload" as="image" href={icon} />
  {/each}
</svelte:head>

<div class="articles" on:scroll={handleListScroll} bind:this={scrollBox}>
  {#if renderedArticles.length > 0}
    <ul class="list" on:contextmenu={handleContextMenu}>
      {#each renderedArticles as article (article.id)}
        <li
          class="article"
          class:active={article.isActive}
          class:selected={article.isSelected}
          class:read={article.isRead}
          data-id={article.id}
          on:touchstart={handleTouchStart}
          on:touchend={handleTouchEnd}
          on:touchmove={handleTouchEnd}
        >
          <a href={`/reader/${selectedFeed}/${article.id}`}>
            <div class="icon">
              {#if article.feed?.icon}
                <img
                  src={article.feed?.icon}
                  title={article.feed?.title}
                  alt={article.feed?.title}
                />
              {/if}
              {#if !article.feed?.icon}
                <div class="monogram" title={article.feed?.title}>
                  {article.feed?.title[0]}
                </div>
              {/if}
            </div>

            <div class="title">
              {@html unescapeHtml(article.title ?? '')}
            </div>

            <div class="age">
              {getAge(article.published ?? undefined)}
            </div>
          </a>
        </li>
      {/each}
    </ul>

    <div class="controls">
      <button
        on:click={() => {
          if ($articles) {
            const ids = $articles.map(({ id }) => id);
            for (const id of ids) {
              updatedArticleIds.delete(id);
            }
            markAsRead(ids, true);
          }
        }}>Mark all read</button
      >
    </div>
  {/if}
  {#if renderedArticles.length === 0}
    <h3 class="empty">Nothing to see here</h3>
  {/if}
</div>

{#if menuAnchor}
  <ContextMenu
    items={[
      { label: 'Mark read', value: 'item-read' },
      { label: 'Mark as unread', value: 'item-unread' },
      { label: 'Mark above as read', value: 'above-read' },
      { label: 'Mark above as unread', value: 'above-unread' },
      { label: 'Mark below as read', value: 'below-read' },
      { label: 'Mark below as unread', value: 'below-unread' }
    ]}
    anchor={menuAnchor}
    onSelect={handleContextSelect}
    onClose={handleContextClose}
  />
{/if}

<style>
  .articles {
    width: var(--sidebar-width);
    overflow-x: hidden;
    overflow-y: auto;
    flex-shrink: 0;
    border-right: solid 1px var(--border);
    position: relative;
  }

  .list {
    list-style-type: none;
    width: 100%;
    padding: 0;
    margin: 0;
  }

  .article {
    --vertical-pad: 0.5rem;
    border-top: solid 1px transparent;
    border-bottom: solid 1px transparent;
    padding: 0 calc(var(--vertical-pad));
    min-height: 2.25rem;
    cursor: pointer;
  }

  .article a {
    text-decoration: none;
    color: inherit;
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: top;
    gap: var(--vertical-pad);
    padding-top: var(--vertical-pad);
    padding-bottom: var(--vertical-pad);
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -webkit-touch-callout: none;
    -webkit-user-drag: none;
    -webkit-tap-highlight-color: transparent;
  }

  .controls,
  .empty {
    padding: 3em;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .active {
    background: var(--matte);
  }

  .read {
    color: #999;
  }

  .selected {
    background: var(--selected);
    border-color: var(--border);
    color: inherit;
  }

  .icon {
    margin-top: calc(var(--font-size) * 0.25);
    flex-grow: 0;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    width: 16px;
  }

  .icon img {
    max-width: 16px;
    max-height: 16px;
    vertical-align: middle;
  }

  .monogram {
    border: solid 1px var(--border);
    background: var(--matte);
    border-radius: var(--border-radius);
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: calc(var(--font-size) * 0.75);
  }

  .title {
    line-height: 1.4em;
    flex-grow: 1;
  }

  .age {
    font-size: calc(var(--font-size) * 0.9);
    text-align: right;
    color: #999;
    white-space: nowrap;
    width: 3em;
  }

  @media (hover: hover) {
    .article:hover:not(.selected) {
      background: var(--matte);
    }
  }

  /* Narrow desktop */
  @media only screen and (max-width: 1000px) {
    .title {
      white-space: normal;
    }
  }
</style>
