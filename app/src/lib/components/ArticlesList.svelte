<script lang="ts">
	import type { ArticleId, ArticleSummary, Feed } from "server";
	import {
		articleFilter,
		articleId,
		articles,
		feedId,
		feeds,
		markArticles,
		updatedArticleIds,
	} from "../state";
	import { getAge, seconds, unescapeHtml } from "../util";
	import ContextMenu from "./ContextMenu.svelte";
	import Button from "./Button.svelte";
	import { goto } from "../router";

	let className = "";
	export { className as class };

	let visibleCount = 40;
	let scrollBox: HTMLElement | undefined;
	// let prevFeedId = $feedId;

	$: {
		if ($feedId) {
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
		if ($articles.length === 0) {
			// there are no articles
			filteredArticles = [];
		} else if ($feedId === "saved" || $articleFilter === "all") {
			// show all articles
			filteredArticles = $articles ?? [];
		} else {
			// show unread (and recently updated) articles
			filteredArticles =
				$articles?.filter(
					({ id, read }) =>
						!read || $updatedArticleIds.has(id) || id === $articleId,
				) ?? [];
		}

		renderedArticles = filteredArticles
			.slice(0, visibleCount)
			.map((article) => ({
				...article,
				feed: $feeds.find(({ id }) => id === article.feed_id),
				isActive: activeArticle?.id === article.id,
				isSelected: $articleId === article.id,
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
			activeArticle = $articles?.find(({ id }) => id === activeArticleId);
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

	function handleTouchMove(_event: TouchEvent) {
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

	function handleClick(event: MouseEvent) {
		const target = event.currentTarget as HTMLElement;
		const url = target.getAttribute("data-href");
		if (url) {
			goto(url);
		}
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
				for (const id of ids) {
					$updatedArticleIds.add(id);
				}
				await markArticles({ article_ids: ids, mark: { read } });
			}
		} else if (/save/i.test(value)) {
			if (activeArticle) {
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
		<ul
			class="divide-y divide-black/10 dark:divide-white/10"
			on:contextmenu={handleContextMenu}
		>
			{#each renderedArticles as article (article.id)}
				<li>
					<a
						class={`
							min-h-[2.25rem]
							p-2
							flex
							flex-row
							gap-2
							text-black
							dark:text-white
							hover:bg-gray-x-light/70
							dark:hover:bg-gray-x-dark/70
							no-callout
							no-swipe
							${article.saved ? "bg-yellow/20" : ""}
							${article.isSelected ? "bg-gray/20" : ""}
							${article.id === activeArticle?.id ? "bg-blue/20" : ""}
						`}
						data-id={article.id}
						href="/reader/{$feedId}/{article.id}"
						on:touchstart={handleTouchStart}
						on:touchend={handleTouchEnd}
						on:touchmove={handleTouchMove}
					>
						<div
							class="w-4 h-4 flex-shrink-0 relative top-1 flex flex-row items-center"
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
									class={`
                    bg-gray-x-dark
										text-white
                    rounded-sm
                    flex
										w-full
										h-full
                    items-center
                    justify-center
	                  text-xs
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
							{@html unescapeHtml(article.title ?? "")}
						</div>

						<div
							class:opacity-50={article.read &&
								!article.isSelected &&
								!article.saved}
						>
							<span class="whitespace-nowrap text-xs text-gray">
								{getAge(article.published ?? undefined)}
							</span>
						</div>
					</a>
				</li>
			{/each}
		</ul>

		<div class="p-6 flex items-center justify-center">
			<Button
				on:click={() => {
					const ids = $articles.map(({ id }) => id);
					markArticles(
						{ article_ids: ids, mark: { read: true } },
						{ ignoreUpdate: true },
					);
				}}>Mark all read</Button
			>
		</div>
	{/if}

	{#if renderedArticles.length === 0}
		<div class="flex items-center justify-center h-full">
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
