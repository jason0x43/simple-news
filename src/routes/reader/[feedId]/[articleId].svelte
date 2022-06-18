<script type="ts">
  import type { ArticleWithUserData } from '$lib/db/article';
  import ArticleView from '$lib/components/ArticleView.svelte';
  import { slide } from '$lib/transition';
  import { displayType } from '$lib/stores';
  import { onMount } from 'svelte';
  import { getReaderContext } from '$lib/contexts';

  export let article: ArticleWithUserData | null;

  let articleView: ArticleView;

  const context = getReaderContext();

  onMount(() => {
    const remove = context.onTitlePress(() => {
      articleView?.resetScroll();
    });

    return () => {
      remove();
    };
  });
</script>

{#if $displayType === 'mobile'}
  <div class="article" out:slide in:slide>
    <ArticleView {article} bind:this={articleView} />
  </div>
{/if}

{#if $displayType !== 'mobile'}
  <div class="article">
    <ArticleView {article} bind:this={articleView} />
  </div>
{/if}

<style>
  .article {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  @media screen and (max-width: 800px) {
    .article {
      position: absolute;
      z-index: 20;
    }
  }
</style>
