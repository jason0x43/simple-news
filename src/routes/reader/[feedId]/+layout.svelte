<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { getAppContext } from '$lib/contexts';
	import ArticlesList from './ArticlesList.svelte';
	import { responseJson } from '$lib/kit';
	import type { ArticleWithUserData } from '$lib/db/article';

	export let data;

	const { articles, sidebarVisible } = getAppContext().stores;

	$: $articles = data.articles;

	$: {
		if (data.feedId) {
			$sidebarVisible = false;
		}
	}

	onMount(() => {
		const interval = setInterval(async () => {
			try {
				if ($page.data.feedId) {
					const resp = await responseJson<ArticleWithUserData[]>(
						fetch(`/api/feedgroups/${$page.data.feedId}/articles`)
					);
					for (const article of resp) {
						if (!$articles.find((a) => a.id === article.id)) {
							$articles.push(article);
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
