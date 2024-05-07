<script lang="ts">
	import { page } from "$app/stores";
	import { markArticles } from "$lib/api.js";
	import { cls } from "$lib/cls";
	import ArticlesList from "$lib/components/ArticlesList.svelte";
	import { fade } from "svelte/transition";

	export let data;
</script>

<div
	class={cls`
		dark:bg-gray-x-x-dark
		bg-gray-x-light
		flex
		w-[33.3333%]
		sm:w-[300px]
	`}
	out:fade={{ duration: 250 }}
>
	<ArticlesList
		feedId={data.feedId}
		feeds={data.feeds}
		articles={data.articles}
		articleFilter={data.articleFilter}
		articleId={$page.data.articleId}
		{markArticles}
	/>
</div>

<slot></slot>
