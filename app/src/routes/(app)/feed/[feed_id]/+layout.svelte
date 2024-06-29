<script lang="ts">
	import { page } from "$app/stores";
	import { markArticles } from "$lib/api.js";
	import { cls } from "$lib/cls";
	import ArticlesList from "$lib/components/ArticlesList.svelte";
	import { getAppContext } from "$lib/context.js";
	import { periodicInvalidate, minutes } from "$lib/util.js";
	import { onMount } from "svelte";
	import { fade } from "svelte/transition";

	export let data;

	const articleFilter = getAppContext("articleFilter");

	onMount(() => {
		return periodicInvalidate("app:articles", minutes(1));
	});
</script>

<div
	class={cls`
		flex
		w-[33.3333%]
		flex-shrink-0
		border-border-light
		sm:w-[300px]
		sm:border-r
		dark:border-border-dark
	`}
	out:fade={{ duration: 250 }}
	in:fade={{ duration: 250 }}
>
	<ArticlesList
		feedId={data.feedId}
		feeds={data.feeds}
		articles={data.articles}
		articleFilter={$articleFilter}
		articleId={$page.data.articleId}
		{markArticles}
	/>
</div>

<slot></slot>
