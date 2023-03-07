<script lang="ts">
	import ArticleView from './ArticleView.svelte';
	import { slide } from '$lib/transition';
	import { onMount } from 'svelte';
	import { getAppContext, getReaderContext } from '$lib/contexts';
	import type { PageData } from './$types';

	export let data: PageData;

	const { feedStats, articles, updatedArticleIds } = getAppContext().stores;

	$: $feedStats = data.feedStats;
	$: article = data.article;
	$: feed = data.feed;
	$: $updatedArticleIds[article.id] = true;

	$: {
		if ($articles) {
			const i = $articles.findIndex(({ id }) => id === article.id);
			if (i !== -1) {
				$articles[i] = article;
			}
		}
	}

	const context = getReaderContext();
	const { displayType } = getAppContext().stores;
	let articleView: ArticleView;

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
		{#if article && feed}
			<ArticleView
				{article}
				{feed}
				bind:this={articleView}
				selectedFeedId={data.feedId}
			/>
		{/if}
	</div>
{/if}

{#if $displayType !== 'mobile'}
	<div class="article">
		{#if article && feed}
			<ArticleView
				{article}
				{feed}
				bind:this={articleView}
				selectedFeedId={data.feedId}
			/>
		{/if}
	</div>
{/if}

<style>
	.article {
		height: 100%;
		width: 100%;
		display: flex;
		position: relative;
		flex-basis: 0;
		flex-grow: 1;
		overflow: hidden;
	}

	@media screen and (max-width: 800px) {
		.article {
			position: absolute;
			z-index: 20;
		}
	}
</style>
