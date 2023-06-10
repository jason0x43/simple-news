<script lang="ts">
	import { browser } from '$app/environment';
	import { getAppContext } from '$lib/contexts';
	import type { Article } from '$lib/db/article';
	import { responseJson } from '$lib/kit';
	import { slide } from '$lib/transition';
	import type { ArticleUpdateResponse } from '$lib/types';
	import { onMount } from 'svelte';
	import ArticleView from './ArticleView.svelte';

	export let data;

	const articles = getAppContext('articles');
	const feeds = getAppContext('feeds');
	const feedStats = getAppContext('feedStats');
	const updatedArticleIds = getAppContext('updatedArticleIds');

	let articleId: Article['id'] | undefined;

	$: $feedStats = data.feedStats;
	$: $updatedArticleIds[data.article.id] = true;
	$: article = data.article;
	$: feed = $feeds.find(({ id }) => id === article?.feed_id);

	$: {
		if (articleId !== data.article.id) {
			markArticle();
		}
	}

	const displayType = getAppContext('displayType');
	const onTitlePress = getAppContext('onTitlePress');

	let articleView: ArticleView;

	onMount(() => {
		const remove = onTitlePress(() => {
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
