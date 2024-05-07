<script lang="ts">
	import { page } from "$app/stores";
	import { markArticles } from "$lib/api.js";
	import ArticlesList from "$lib/components/ArticlesList.svelte";

	export let data;
</script>

<div class="flex w-[33.3333%] border-r border-gray sm:w-[300px]">
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
