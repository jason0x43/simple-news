<script context="module" type="ts">
  // TODO: replace this with a layout endpoint when available
  import type { Load } from './__types/__layout';

  export const load: Load = async ({ fetch, params }) => {
    const feedId = params.feedId;
    const query = new URLSearchParams();
    query.append('feedId', feedId);
    const resp = await fetch(`/api/articles?${query}`);
    const articleHeadings = await resp.json();

    return {
      props: {
        articleHeadings,
        feedId
      }
    };
  };
</script>

<script type="ts">
  import ArticlesList from '$lib/components/ArticlesList.svelte';
  import type { ArticleHeadingWithUserData } from '$lib/db/article';
  import { getAppContext } from '$lib/contexts';

  export let articleHeadings: ArticleHeadingWithUserData[];
  export let feedId: string;

  const { articles, feeds, feedGroups, selectedFeedIds } =
    getAppContext().stores;

  $: $articles = articleHeadings;

  $: {
    const [type, id] = feedId.split('-');
    if (type === 'group') {
      const group = $feedGroups.find((group) => group.id === id);
      $selectedFeedIds = group?.feeds.map(({ id }) => id) ?? [];
    } else {
      const feed = $feeds.find((feed) => feed.id === id);
      $selectedFeedIds = feed ? [feed.id] : [];
    }
  }
</script>

<div class="feed-layout">
  <ArticlesList />
  <slot />
</div>

<style>
  .feed-layout {
    height: 100%;
    display: flex;
    flex-direction: row;
  }
</style>
