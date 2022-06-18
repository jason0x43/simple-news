<script context="module" type="ts">
  import type { Load } from './__types/__layout';

  export const load: Load = async ({ fetch, params }) => {
    const feedId = params.feedId;

    // TODO: replace this with a layout endpoint when available
    const resp = await fetch(`/api/articles?feedId=${feedId}`);
    const articleHeadings = await resp.json();

    return {
      props: {
        articleHeadings
      }
    };
  };
</script>

<script type="ts">
  import ArticlesList from '$lib/components/ArticlesList.svelte';
  import type { ArticleHeadingWithUserData } from '$lib/db/article';
  import { articles } from '$lib/stores';

  export let articleHeadings: ArticleHeadingWithUserData[];

  $: $articles = articleHeadings;
</script>

<ArticlesList />

<slot />
