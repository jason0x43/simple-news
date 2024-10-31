<script lang="ts">
	import { getAge, seconds, unescapeHtml } from "../util";
	import ContextMenu from "./ContextMenu.svelte";
	import Button from "./Button.svelte";
	import { goto } from "$app/navigation";
	import { getAppContext } from "$lib/context";
	import type { ArticleFilter } from "$lib/types";
	import type {
		ArticleId,
		ArticleSummary,
		Feed,
		MarkArticlesRequest,
	} from "@jason0x43/reader-types";

	const updatedArticleIds = getAppContext("updatedArticleIds");

	let {
		feedId: feedIdProp,
		feeds,
		articleId: articleIdProp,
		articles,
		articleFilter,
		markArticles,
		class: className = "",
	}: {
		feedId: string;
		feeds: Feed[];
		articleId: string | undefined;
		articles: ArticleSummary[];
		articleFilter: ArticleFilter;
		markArticles: (data: MarkArticlesRequest) => Promise<void>;
		class?: string;
	} = $props();

	let visibleCount = $state(40);
	let scrollBox: HTMLElement | undefined = $state();
	let selectedArticle: HTMLElement | undefined = $state();
	let menuAnchor: { x: number; y: number } | undefined = $state();
	let activeArticle: ArticleSummary | undefined = $state();

	// Derive new state from props to avoid triggering an effect on every load,
	// even when the feedId hasn't changed
	let feedId = $derived(feedIdProp);
	let articleId = $derived(articleIdProp);

	let filteredArticles = $derived.by(() => {
		if (articles.length === 0) {
			// there are no articles
			return [];
		}
		if (feedId === "saved" || articleFilter === "all") {
			// show all articles
			return articles ?? [];
		}
		// show unread (and recently updated) articles
		return (
			articles?.filter(
				({ id, read }) =>
					!read || $updatedArticleIds.has(id) || id === articleId,
			) ?? []
		);
	});

	let renderedArticles = $derived(
		filteredArticles.slice(0, visibleCount).map((article) => ({
			...article,
			feed: feeds.find(({ id }) => id === article.feed_id),
			isActive: activeArticle?.id === article.id,
			isSelected: articleId === article.id,
		})),
	);

	// Reset state when selected feed changes
	$effect(() => {
		if (feedId) {
			visibleCount = 40;
			scrollBox?.scrollTo(0, 0);
		}
	});

	// Scroll the selected article into view when the page loads
	$effect(() => {
		if (articleId && selectedArticle) {
			selectedArticle.scrollIntoView({ behavior: "smooth" });
		}
	});

	function handleContextMenu(event: {
		target: EventTarget | null;
		x: number;
		y: number;
		preventDefault?: () => void;
	}) {
		let target = event.target as HTMLElement | null;
		while (target && !target.hasAttribute("data-id")) {
			target = target.parentElement;
		}

		if (target) {
			const activeArticleId = target.getAttribute("data-id") as string;
			activeArticle = articles?.find(({ id }) => id === activeArticleId);
			menuAnchor = { x: event.x, y: event.y };
			event.preventDefault?.();
		}
	}

	let touchTimer: ReturnType<typeof setTimeout> | undefined;
	let longPressed = false;
	let moved = false;

	function handleTouchStart(event: TouchEvent) {
		const { pageX, pageY } = event.touches[0];

		touchTimer = setTimeout(() => {
			longPressed = true;
			handleContextMenu({
				target: event.target,
				x: pageX,
				y: pageY,
			});
		}, seconds(0.5));
	}

	function handleTouchMove() {
		clearTimeout(touchTimer);
		longPressed = false;
		moved = true;
	}

	function handleTouchEnd(event: TouchEvent) {
		clearTimeout(touchTimer);
		if (longPressed || moved) {
			event.preventDefault();
		} else if (!menuAnchor) {
			const target = event.currentTarget as HTMLElement;
			const url = target.getAttribute("data-href");
			if (url) {
				goto(url);
			}
		}
		longPressed = false;
		moved = false;
	}

	async function handleContextSelect(value: string) {
		if (/read/i.test(value)) {
			const read = !/unread/i.test(value);
			let ids: ArticleId[] | undefined;

			if (/above/i.test(value)) {
				const idx = renderedArticles.findIndex(
					({ id }) => id === activeArticle?.id,
				);
				ids = renderedArticles.slice(0, idx).map(({ id }) => id);
			} else if (/below/i.test(value)) {
				const idx = renderedArticles.findIndex(
					({ id }) => id === activeArticle?.id,
				);
				ids = renderedArticles.slice(idx + 1).map(({ id }) => id);
			} else if (activeArticle) {
				ids = [activeArticle.id];
			}

			if (ids) {
				ids.forEach((id) => ($updatedArticleIds = $updatedArticleIds.add(id)));
				await markArticles({ articleIds: ids, mark: { read } });
			}
		} else if (/save/i.test(value)) {
			if (activeArticle) {
				$updatedArticleIds = $updatedArticleIds.add(activeArticle.id);
				await markArticles({
					articleIds: [activeArticle.id],
					mark: { saved: !activeArticle.saved },
				});
			}
		}
	}

	function handleContextClose() {
		menuAnchor = undefined;
		activeArticle = undefined;
	}

	function handleListScroll(event: Event) {
		const target = event.target as HTMLDivElement;
		const { clientHeight, scrollHeight, scrollTop } = target;
		// Load 20 new articles when we've gotten within 500 pixels of the end of
		// the list
		const remaining = scrollHeight - (scrollTop + clientHeight);
		if (remaining < 500 && visibleCount < filteredArticles.length) {
			const newCount = Math.min(visibleCount + 20, filteredArticles.length);
			visibleCount = newCount;
		}
	}
</script>

<div
	class="flex-auto select-none overflow-y-auto py-2 {className}"
	onscroll={handleListScroll}
	bind:this={scrollBox}
>
	{#if renderedArticles.length > 0}
		<ul oncontextmenu={handleContextMenu}>
			{#each renderedArticles as article (article.id)}
				<li>
					<a
						class="
							no-callout
							no-swipe
							mx-2
							flex
							min-h-[2.25rem]
							flex-row
							gap-2
							rounded-md
							border
							border-transparent
							p-2
							{article.saved ? 'bg-yellow/20' : ''}
							{article.id === activeArticle?.id ? 'bg-blue/20' : ''}
						"
						class:selected={article.isSelected}
						class:not-selected={!article.isSelected}
						bind:this={selectedArticle}
						data-id={article.id}
						href="/feed/{feedId}/{article.id}"
						ontouchstart={handleTouchStart}
						ontouchend={handleTouchEnd}
						ontouchmove={handleTouchMove}
					>
						<div
							class="
								relative
								top-[2px]
								flex
								h-4
								w-4
								flex-shrink-0
								flex-row
								items-center
							"
							class:opacity-50={article.read &&
								!article.isSelected &&
								!article.saved}
						>
							{#if article.feed?.icon}
								<img
									class="object-contain"
									src={article.feed?.icon}
									title={article.feed?.title}
									alt={article.feed?.title}
								/>
							{/if}
							{#if !article.feed?.icon}
								<div
									class="
										flex
										h-full
										w-full
										items-center
										justify-center
										rounded-sm
										bg-gray-x-dark
										text-xs
									"
									title={article.feed?.title}
								>
									{article.feed?.title[0]}
								</div>
							{/if}
						</div>

						<div
							class="flex-auto"
							class:opacity-50={article.read &&
								!article.isSelected &&
								!article.saved}
						>
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html unescapeHtml(article.title ?? "")}
						</div>

						<div
							class:opacity-50={article.read &&
								!article.isSelected &&
								!article.saved}
						>
							<span
								class="
									text-disabled
									whitespace-nowrap
									text-xs
									dark:text-disabled-dark
								"
							>
								{getAge(article.published ?? undefined)}
							</span>
						</div>
					</a>
				</li>
			{/each}
		</ul>

		<div class="flex items-center justify-center p-6">
			<Button
				onclick={() => {
					const ids = articles.map(({ id }) => id);
					ids.forEach(
						(id) => ($updatedArticleIds = $updatedArticleIds.add(id)),
					);
					markArticles({ articleIds: ids, mark: { read: true } });
				}}>Mark all read</Button
			>
		</div>
	{/if}

	{#if renderedArticles.length === 0}
		<div class="flex h-full items-center justify-center">
			<h3 class="">Nothing to see here</h3>
		</div>
	{/if}
</div>

{#if menuAnchor}
	<ContextMenu
		items={[
			{
				label: activeArticle?.saved ? "Unsave" : "Save",
				value: `item-${activeArticle?.saved ? "unsave" : "save"}`,
			},
			{ label: "Mark as unread", value: "item-unread" },
			{ label: "Mark above as read", value: "above-read" },
			{ label: "Mark above as unread", value: "above-unread" },
			{ label: "Mark below as read", value: "below-read" },
			{ label: "Mark below as unread", value: "below-unread" },
		]}
		anchor={menuAnchor}
		onSelect={handleContextSelect}
		onClose={handleContextClose}
	/>
{/if}

<style lang="postcss">
	.selected {
		@apply border-gray-light bg-hover-light dark:border-gray-dark dark:bg-hover-dark;
	}

	.not-selected {
		@apply hover:bg-hover-light dark:hover:bg-hover-dark;
	}
</style>
