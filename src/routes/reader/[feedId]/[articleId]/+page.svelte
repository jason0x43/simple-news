<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { Article } from '$lib/db/article';
	import { getAppContext, getReaderContext } from '$lib/contexts';
	import { slide } from '$lib/transition';
	import ArticleView from './ArticleView.svelte';
	import { responseJson } from '$lib/kit';
	import type { ArticleUpdateResponse } from '$lib/types';

	export let data;

	const { articles, feeds, feedStats, updatedArticleIds } =
		getAppContext().stores;

	let articleId: Article['id'] | undefined;

	$: $feedStats = data.feedStats;
	$: $updatedArticleIds[data.article.id] = true;
	$: article = $articles.find(({ id }) => id === data.article.id);
	$: feed = $feeds.find(({ id }) => id === article?.feed_id);

	$: {
		if (articleId !== data.article.id) {
			markArticle();
		}
	}

	const context = getReaderContext();
	const { displayType } = getAppContext().stores;
	let articleView: ArticleView;

	onMount(() => {
		const remove = context.onTitlePress(() => {
			articleView?.resetScroll();
		});

		return remove;
	});

	async function markArticle() {
		if (!browser) {
			return;
		}

		const updates = await responseJson<ArticleUpdateResponse>(
			fetch('/api/articles', {
				method: 'PUT',
				body: JSON.stringify({
					articleIds: [data.article.id],
					userData: { read: true }
				})
			})
		);

		$feedStats = updates.feedStats;
		const updatedArticle = updates.updatedArticles[0];
		if (updatedArticle) {
			const idx = $articles.findIndex(
				({ id }) => updatedArticle.article_id === id
			);
			if (idx !== -1) {
				$articles[idx] = {
					...$articles[idx],
					...updatedArticle
				};
			}
			articleId = updatedArticle.article_id;
		}
	}
</script>

{#if $displayType === 'mobile'}
	<div class="article" out:slide in:slide>
		{#if article && feed}
			<ArticleView
				{article}
				{feed}
				bind:this={articleView}
				selectedFeedId={feed?.id}
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
				selectedFeedId={feed?.id}
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
