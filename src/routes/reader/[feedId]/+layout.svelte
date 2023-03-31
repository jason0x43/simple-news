<script lang="ts">
	import { onMount } from 'svelte';
	import { getAppContext } from '$lib/contexts';
	import ArticlesList from './ArticlesList.svelte';
	import { get as getFeedArticles } from '../../api/feedgroups/[groupId]/articles';

	export let data;

	const { articles, feedId, selectedFeedIds, sidebarVisible } =
		getAppContext().stores;

	$: $articles = data.articles;
	$: $feedId = data.feedId;
	$: $selectedFeedIds = data.selectedFeedIds;

	$: {
		if (data.feedId) {
			$sidebarVisible = false;
		}
	}

	onMount(() => {
		const interval = setInterval(async () => {
			try {
				if ($feedId) {
					const resp = await getFeedArticles($feedId);
					$articles = resp;
				}
			} catch (error) {
				console.warn('Error updating articles list');
			}
		}, 600_000);

		return () => {
			clearInterval(interval);
		};
	});
</script>

<div class="feed-layout">
	<ArticlesList feedId={data.feedId} />
	<slot />
</div>

<style>
	.feed-layout {
		height: 100%;
		display: flex;
		flex-direction: row;
	}
</style>
