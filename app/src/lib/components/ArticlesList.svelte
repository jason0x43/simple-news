<script lang="ts">
	import type { ArticleId, ArticleSummary, Feed } from "server";
	import {
		articleId,
		articles,
		feedId,
		feeds,
		updatedArticleIds,
	} from "../state";
	import { getAge, unescapeHtml } from "../util";
	import ContextMenu from "./ContextMenu.svelte";

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
		} else if ($feedId === "saved") {
			// show all articles
			filteredArticles = $articles ?? [];
		} else {
			// show unread (and recently updated) articles
			filteredArticles =
				// $articles?.filter(
				// 	({ id }) => $updatedArticleIds.has(id) || id === $articleId
				// ) ?? [];
				$articles;
		}
	}

	$: {
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

	let touchTimer: ReturnType<typeof setTimeout>;
	let isLongPress = false;

	function handleTouchStart(event: TouchEvent) {
		isLongPress = false;

		if (menuAnchor) {
			handleContextClose();
			event.preventDefault();
		} else {
			const { pageX, pageY } = event.touches[0];
			touchTimer = setTimeout(() => {
				isLongPress = true;
				handleContextMenu({
					target: event.target,
					x: pageX,
					y: pageY,
				});
			}, 500);
		}
	}

	function handleTouchEnd(event: TouchEvent) {
		clearTimeout(touchTimer);
		if (isLongPress) {
			event.preventDefault();
		}
	}

	async function handleContextSelect(value: string) {
		if (/read/i.test(value)) {
			// const read = !/unread/i.test(value);
			let ids: ArticleId[] | undefined;

			if (/above/i.test(value)) {
				const idx = renderedArticles.findIndex(
					({ id }) => id === activeArticle?.id
				);
				ids = renderedArticles.slice(0, idx).map(({ id }) => id);
			} else if (/below/i.test(value)) {
				const idx = renderedArticles.findIndex(
					({ id }) => id === activeArticle?.id
				);
				ids = renderedArticles.slice(idx + 1).map(({ id }) => id);
			} else if (activeArticle) {
				ids = [activeArticle.id];
			}

			if (ids) {
				for (const id of ids) {
					$updatedArticleIds.add(id);
				}
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

<div class="articles" on:scroll={handleListScroll}>
	{#if renderedArticles.length > 0}
		<ul class="list" on:contextmenu={handleContextMenu}>
			{#each renderedArticles as article (article.id)}
				<li
					class="article"
					class:active={article.isActive}
					class:selected={article.isSelected}
					data-id={article.id}
					on:touchstart={handleTouchStart}
					on:touchend={handleTouchEnd}
					on:touchmove={handleTouchEnd}
				>
					<a href={`/reader/${$feedId}/${article.id}`}>
						<div class="icon">
							{#if article.feed?.icon}
								<img
									src={article.feed?.icon}
									title={article.feed?.title}
									alt={article.feed?.title}
								/>
							{/if}
							{#if !article.feed?.icon}
								<div class="monogram" title={article.feed?.title}>
									{article.feed?.title[0]}
								</div>
							{/if}
						</div>

						<div class="title">
							{@html unescapeHtml(article.title ?? "")}
						</div>

						<div class="age">
							<span>
								{getAge(article.published ?? undefined)}
							</span>
						</div>
					</a>
				</li>
			{/each}
		</ul>

		<div class="controls">
			<button
				on:click={() => {
					const ids = $articles.map(({ id }) => id);
					for (const id of ids) {
						$updatedArticleIds.delete(id);
					}
				}}>Mark all read</button
			>
		</div>
	{/if}
	{#if renderedArticles.length === 0}
		<h3 class="empty">Nothing to see here</h3>
	{/if}
</div>

{#if menuAnchor}
	<ContextMenu
		items={[
			// {
			// 	label: activeArticle?.saved ? "Unsave" : "Save",
			// 	value: `item-${activeArticle?.saved ? "unsave" : "save"}`,
			// },
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

<style>
	.articles {
		width: var(--sidebar-width);
		height: 100%;
		overflow-x: hidden;
		overflow-y: auto;
		flex-shrink: 0;
		border-right: solid 1px var(--border);
		position: relative;
		user-select: none;
	}

	.list {
		list-style-type: none;
		width: 100%;
		padding: 0;
		margin: 0;
		user-select: none;
	}

	.article {
		--vertical-pad: 0.5rem;
		border-top: solid 1px transparent;
		border-bottom: solid 1px transparent;
		padding: 0 calc(var(--vertical-pad));
		min-height: 2.25rem;
		cursor: pointer;
		user-select: none;
		position: relative;
	}

	.article a {
		text-decoration: none;
		color: inherit;
		width: 100%;
		display: flex;
		flex-direction: row;
		align-items: top;
		gap: var(--vertical-pad);
		padding-top: var(--vertical-pad);
		padding-bottom: var(--vertical-pad);
		user-select: none;
		-webkit-user-select: none;
		-moz-user-select: none;
		-webkit-touch-callout: none;
		-webkit-user-drag: none;
		-webkit-tap-highlight-color: transparent;
	}

	.controls,
	.empty {
		padding: 3em;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.active {
		background: var(--matte);
	}

	/* .read { */
	/* 	opacity: 0.5; */
	/* } */

	.selected {
		background: var(--selected);
		border-color: var(--border);
		opacity: 1;
	}

	/* .saved { */
	/* 	opacity: 1; */
	/* } */

	.icon {
		margin-top: calc(var(--font-size) * 0.15);
		flex-grow: 0;
		flex-shrink: 0;
		display: flex;
		justify-content: center;
		width: 16px;
	}

	.icon img {
		max-width: 16px;
		max-height: 16px;
		padding: 2px;
		vertical-align: middle;
	}

	.monogram {
		border: solid 1px var(--border);
		background: var(--matte);
		border-radius: var(--border-radius);
		width: 16px;
		height: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: calc(var(--font-size) * 0.75);
	}

	.title {
		line-height: 1.4em;
		flex-grow: 1;
	}

	.age {
		font-size: calc(var(--font-size) * 0.9);
		text-align: right;
		color: #999;
		white-space: nowrap;
		width: 3em;
		padding-top: 2px;
	}

	.age span {
		padding: 0 3px 1px 3px;
		border: none;
	}

	.saved .age span {
		background: rgba(125, 220, 125, 0.2);
		border-radius: 3px;
		box-shadow: 0 0 0 2px rgba(125, 220, 125, 0.3);
	}

	@media (hover: hover) {
		.article:hover:not(.selected) {
			background: var(--matte);
		}
	}

	/* Narrow desktop */
	@media only screen and (max-width: 1000px) {
		.title {
			white-space: normal;
		}
	}
</style>
