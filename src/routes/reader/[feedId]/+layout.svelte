<script lang="ts">
	import ArticlesList from '$lib/components/ArticlesList.svelte';
	import { getAppContext } from '$lib/contexts';
	import type { PageData } from './$types';

	export let data: PageData;

	const { articles, feeds, feedGroups, selectedFeedIds, sidebarVisible } =
		getAppContext().stores;

	$sidebarVisible = false;

	$: $articles = data.articleHeadings;

	$: {
		if (data.feedId) {
			const [type, id] = data.feedId.split('-');
			if (type === 'group') {
				const group = $feedGroups.find((group) => group.id === id);
				$selectedFeedIds = group?.feeds.map(({ id }) => id) ?? [];
			} else {
				const feed = $feeds.find((feed) => feed.id === id);
				$selectedFeedIds = feed ? [feed.id] : [];
			}
		}
	}
</script>

<div class="feed-layout">
	<ArticlesList
		selectedFeedId={data.feedId}
		selectedArticleId={data.articleId}
	/>
	<slot />
</div>

<style>
	.feed-layout {
		height: 100%;
		display: flex;
		flex-direction: row;
	}
</style>
