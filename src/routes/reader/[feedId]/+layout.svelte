<script lang="ts">
	import ArticlesList from './ArticlesList.svelte';
	import { getAppContext } from '$lib/contexts';
	import type { PageData } from './$types';

	export let data: PageData;

	const {
		articles,
		feedId,
		feedName,
		selectedFeedIds,
		sidebarVisible,
		selectedArticleId
	} = getAppContext().stores;

	$: $selectedArticleId = data.articleId;
	$: $articles = data.articleHeadings;
	$: $feedName = data.feedName;
	$: $feedId = data.feedId;
	$: $selectedFeedIds = data.selectedFeedIds;

	let prevFeedId = data.feedId;

	$: {
		if (data.feedId !== prevFeedId) {
			prevFeedId = data.feedId;
			if (data.feedId) {
				$sidebarVisible = false;
			}
		}
	}
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
