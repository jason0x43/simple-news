<script lang="ts">
	import ArticlesList from './ArticlesList.svelte';
	import { getAppContext } from '$lib/contexts';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
	import { get } from '$lib/request';
	import type { ArticleHeadingWithUserData } from '$lib/db/article';

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

	onMount(() => {
		const interval = setInterval(async () => {
			try {
				const resp = await get<ArticleHeadingWithUserData[]>(
					`/api/feedgroups/${$feedId}/articles`
				);
				$articles = resp;
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
