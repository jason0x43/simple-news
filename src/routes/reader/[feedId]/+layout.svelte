<script lang="ts">
	import { page } from '$app/stores';
	import { getAppContext, setAppContext } from '$lib/contexts';
	import type { ArticleHeadingWithUserData } from '$lib/db/article';
	import { responseJson } from '$lib/kit';
	import { onMount } from 'svelte';
	import ArticlesList from './ArticlesList.svelte';
	import { writable } from 'svelte/store';

	export let data;

	const sidebarVisible = getAppContext('sidebarVisible');

	// Ids of articles that have been updated while viewing a feed ID
	const updatedArticleIds = setAppContext('updatedArticleIds', writable({}));

	// The currently loaded article headings
	const articles = setAppContext('articles', writable([]));

	$: $articles = data.articles;

	$: {
		if (data.feedId) {
			$sidebarVisible = false;
			$updatedArticleIds = {};
		}
	}

	onMount(() => {
		const interval = setInterval(async () => {
			try {
				if ($page.data.feedId) {
					const resp = await responseJson<ArticleHeadingWithUserData[]>(
						fetch(`/api/feedgroups/${$page.data.feedId}/articles`)
					);
					for (const article of resp) {
						if (!$articles.find((a) => a.id === article.id)) {
							$articles = [...$articles, article];
						}
					}
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
