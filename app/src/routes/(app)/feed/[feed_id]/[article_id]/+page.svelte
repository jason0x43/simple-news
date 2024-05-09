<script lang="ts">
	import { markArticles } from "$lib/api.js";
	import ArticleView from "$lib/components/ArticleView.svelte";
	import { getAppContext } from "$lib/context.js";
	import { fade } from "svelte/transition";

	export let data;

	const updatedArticleIds = getAppContext("updatedArticleIds");
	let renderedArticle: string | undefined;

	$: {
		if (renderedArticle !== data.article.id) {
			renderedArticle = data.article.id;

			updatedArticleIds.update((current) => {
				return new Set(current).add(data.article.id);
			});

			markArticles({
				article_ids: [data.article.id],
				mark: { read: true },
			}).catch((error) => {
				console.warn(
					`Error marking article ${data.article.id} as read: ${error}`,
				);
			});
		}
	}
</script>

<div
	class="flex w-[33.3333%] sm:w-[100vw] lg:w-[calc(100vw-300px)]"
	transition:fade={{ duration: 250 }}
>
	<ArticleView article={data.article} feedId={data.feedId} feeds={data.feeds} />
</div>
