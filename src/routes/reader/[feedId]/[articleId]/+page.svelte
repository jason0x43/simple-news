<script lang="ts">
	import ArticleView from './ArticleView.svelte';
	import { slide } from '$lib/transition';
	import { onMount } from 'svelte';
	import { getAppContext, getReaderContext } from '$lib/contexts';
	import { put as putArticles } from '../../../api/articles';

	export let data;

	const { articles, feeds, feedStats, selectedArticleId, updatedArticleIds } =
		getAppContext().stores;

	let articleId = data.articleId;

	$: $selectedArticleId = data.articleId;
	$: $feedStats = data.feedStats;
	$: $updatedArticleIds[data.articleId] = true;
	$: article = $articles.find(({ id }) => id === data.articleId);
	$: feed = $feeds.find(({ id }) => id === article?.feed_id);

	$: {
		if (articleId !== data.articleId) {
			putArticles({
				articleIds: [data.articleId],
				userData: { read: true }
			}).then((updates) => {
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
			});
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
