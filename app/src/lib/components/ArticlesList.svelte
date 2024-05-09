<script lang="ts">
	import type {
		ArticleId,
		ArticleSummary,
		ArticlesMarkRequest,
		Feed,
	} from "$server";
	import { getAge, seconds, unescapeHtml } from "../util";
	import ContextMenu from "./ContextMenu.svelte";
	import Button from "./Button.svelte";
	import { goto } from "$app/navigation";
	import { getAppContext } from "$lib/context";
	import type { ArticleFilter } from "$lib/types";
	import { cls } from "$lib/cls";

	export let feedId: string;
	export let feeds: Feed[];
	export let articleId: string | undefined;
	export let articles: ArticleSummary[];
	export let articleFilter: ArticleFilter;
	export let markArticles: (data: ArticlesMarkRequest) => Promise<void>;

	const updatedArticleIds = getAppContext("updatedArticleIds");

	let className = "";
	export { className as class };

	let visibleCount = 40;
	let scrollBox: HTMLElement | undefined;

	$: {
		if (feedId) {
			// reset state when selected feed changes
			visibleCount = 40;
			scrollBox?.scrollTo(0, 0);
		}
	}

	let menuAnchor: { x: number; y: number } | undefined;
	let activeArticle: ArticleSummary | undefined;
	let filteredArticles: ArticleSummary[] = [];
	let renderedArticles: (ArticleSummary & {
		feed: Feed | undefined;
		isActive: boolean;
		isSelected: boolean;
	})[] = [];

	$: {
		if (articles.length === 0) {
			// there are no articles
			filteredArticles = [];
		} else if (feedId === "saved" || articleFilter === "all") {
			// show all articles
			filteredArticles = articles ?? [];
		} else {
			// show unread (and recently updated) articles
			filteredArticles =
				articles?.filter(
					({ id, read }) =>
						!read || $updatedArticleIds.has(id) || id === articleId,
				) ?? [];
		}

		renderedArticles = filteredArticles
			.slice(0, visibleCount)
			.map((article) => ({
				...article,
				feed: feeds.find(({ id }) => id === article.feed_id),
				isActive: activeArticle?.id === article.id,
				isSelected: articleId === article.id,
			}));
	}

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
				await markArticles({ article_ids: ids, mark: { read } });
			}
		} else if (/save/i.test(value)) {
			if (activeArticle) {
				$updatedArticleIds = $updatedArticleIds.add(activeArticle.id);
				await markArticles({
					article_ids: [activeArticle.id],
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
	class="flex-auto select-none overflow-y-auto {className}"
	on:scroll={handleListScroll}
>
	{#if renderedArticles.length > 0}
		<ul on:contextmenu={handleContextMenu}>
			{#each renderedArticles as article (article.id)}
				<li>
					<a
						class={cls`
							no-callout
							no-swipe
							text-dark-gray
							flex
							min-h-[2.25rem]
							flex-row
							gap-2
							p-2
							dark:text-gray
							${article.saved ? "bg-yellow/20" : ""}
							${article.id === activeArticle?.id ? "bg-blue/20" : ""}
						`}
						class:selected={article.isSelected}
						class:not-selected={!article.isSelected}
						data-id={article.id}
						href="/feed/{feedId}/{article.id}"
						on:touchstart={handleTouchStart}
						on:touchend={handleTouchEnd}
						on:touchmove={handleTouchMove}
					>
						<div
							class={cls`
								relative
								top-[2px]
								flex
								h-4
								w-4
								flex-shrink-0
								flex-row
								items-center
							`}
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
									class={cls`
										flex
										h-full
										w-full
										items-center
										justify-center
										rounded-sm
										bg-gray-x-dark
										text-xs
										text-white
									`}
									title={article.feed?.title}
								>
									{article.feed?.title[0]}
								</div>
							{/if}
						</div>

						<div
							class="flex-auto"
							class:text-gray-dark={article.read && !article.isSelected}
							class:dark:text-gray-light={article.read && !article.isSelected}
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
								class={cls`
									whitespace-nowrap
									text-xs
									text-gray-dark/40
									dark:text-gray-light/40
								`}
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
				on:click={() => {
					const ids = articles.map(({ id }) => id);
					ids.forEach(
						(id) => ($updatedArticleIds = $updatedArticleIds.add(id)),
					);
					markArticles({ article_ids: ids, mark: { read: true } });
				}}>Mark all read</Button
			>
		</div>
	{/if}

	{#if renderedArticles.length === 0}
		<div
			class={cls`
				flex
				h-full
				items-center
				justify-center
				text-gray-dark
				dark:text-gray
			`}
		>
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
		@apply bg-gradient-to-l from-white to-gray-light dark:from-black dark:to-gray-dark;
	}

	.not-selected {
		@apply hover:bg-gray-x-light/70 dark:hover:bg-gray-x-dark/70;
	}
</style>
