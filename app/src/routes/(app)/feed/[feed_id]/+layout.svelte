<script lang="ts">
	import { invalidate } from "$app/navigation";
	import { page } from "$app/stores";
	import { markArticles } from "$lib/api.js";
	import { cls } from "$lib/cls";
	import ArticlesList from "$lib/components/ArticlesList.svelte";
	import { interval, minutes } from "$lib/util.js";
	import { onMount } from "svelte";
	import { fade } from "svelte/transition";

	export let data;

	onMount(() => {
		return interval(() => {
			invalidate("app:articles");
		}, minutes(15));
	});
</script>

<div
	class={cls`
		flex
		w-[33.3333%]
		flex-shrink-0
		bg-gray-x-light
		sm:w-[300px]
		dark:bg-gray-x-x-dark
	`}
	out:fade={{ duration: 250 }}
	in:fade={{ duration: 250 }}
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
