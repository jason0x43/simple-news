<script lang="ts">
	import ArticleView from '$lib/components/ArticleView.svelte';
	import { slide } from '$lib/transition';
	import { onMount } from 'svelte';
	import { getAppContext, getReaderContext } from '$lib/contexts';
	import type { PageData } from './$types';

	export let data: PageData;

	$: article = data.article;

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
		<ArticleView
			{article}
			bind:this={articleView}
			selectedFeedId={data.feedId}
		/>
	</div>
{/if}

{#if $displayType !== 'mobile'}
	<div class="article">
		<ArticleView
			{article}
			bind:this={articleView}
			selectedFeedId={data.feedId}
		/>
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
