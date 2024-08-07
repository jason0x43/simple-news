<script lang="ts">
	import Header from "$lib/components/Header.svelte";
	import { setAppContext } from "$lib/context";
	import { readonly, writable } from "svelte/store";
	import FeedManager from "$lib/components/FeedManager.svelte";
	import FeedsList from "$lib/components/FeedsList.svelte";
	import Button from "$lib/components/Button.svelte";
	import Select from "$lib/components/Select.svelte";
	import { page } from "$app/stores";
	import { cls } from "$lib/cls";
	import { onMount } from "svelte";
	import { periodicInvalidate, minutes } from "$lib/util";
	import { FeedGroupId, FeedId } from "simple-news-types";
	import type { ArticleFilter } from "$lib/types";

	export let data;

	let rootRef: HTMLElement | undefined;

	const root = writable<HTMLElement>();
	setAppContext("root", readonly(root));

	const managingFeeds = writable<boolean>(false);
	setAppContext("managingFeeds", managingFeeds);

	const updatedArticleIds = writable<Set<string>>(new Set());
	setAppContext("updatedArticleIds", updatedArticleIds);

	const articleFilter = writable("unread" as ArticleFilter)
	setAppContext("articleFilter", articleFilter);

	let selectedFeedIds: FeedId[] = [];
	let selectedGroupId: FeedGroupId | undefined;

	$: {
		const feedId = $page.data.feedId;
		selectedGroupId = undefined;

		if (feedId && feedId !== "saved") {
			const [type, id] = feedId.split("-");
			if (type === "group") {
				const group = data.feedGroups.find((g) => g.id === id);
				selectedFeedIds = group?.feed_ids ?? [];
				selectedGroupId = FeedGroupId.parse(id);
			} else {
				selectedFeedIds = [FeedId.parse(id)];
			}
		} else {
			selectedFeedIds = [];
		}
	}

	$: {
		if (rootRef) {
			$root = rootRef;
		}
	}

	let edgeTouch = false;

	function handleTouchStart(event: TouchEvent) {
		const touch = event.touches[0];
		if (touch.pageX < 20 || touch.pageX > window.innerWidth - 20) {
			edgeTouch = true;
		}
	}

	function handleTouchMove(event: TouchEvent) {
		if (edgeTouch) {
			event.preventDefault();
		}
	}

	function handleTouchEnd() {
		edgeTouch = false;
	}

	function updateArticleFilter(value: string) {
		$articleFilter = value as ArticleFilter;
	}

	let ready = false;

	onMount(() => {
		setTimeout(() => {
			ready = true;
		});

		return periodicInvalidate("app:feedStats", minutes(15));
	});
</script>

<!-- Layout

Default (mobile): content width is 300%, screen shows 1 column at a time

     ------------- 
   /               \
   | +--------------|----------------------------+
	 | |              |              /             |
	 | |  Feeds       |   Articles   /  Article    |
	 | |              |              /             |
	 | |              |              /             |
	 | |              |              /             |
	 | |              |              /             |
	 | |              |              /             |
	 | |              |              /             |
   | +--------------|----------------------------+
    \              /
      ------------ 

                     ---------- 
                   /            \
   +--------------|--------------|-------------+
	 |              |              |             |
	 |  Feeds       |   Articles   |  Article    |
	 |              |              |             |
	 |              |              |             |
	 |              |              |             |
	 |              |              |             |
	 |              |              |             |
	 |              |              |             |
   +--------------|--------------|-------------+
                   \            /
                     ---------- 

Small: content width is 400%, screen shows 2 columns at a time

     ----------------------------- 
   /                               \
   | +-----------------------------|---------------------------+
	 | |              |              |                           |
	 | |  Feeds       |  <Articles>  |         <Article>         |
	 | |              |              |                           |
	 | |              |              |                           |
	 | |              |              |                           |
	 | |              |              |                           |
	 | |              |              |                           |
	 | |              |              |                           |
   | +-----------------------------|---------------------------+
    \                             /
      ---------------------------- 

                                    ----------------------------
                                  /                              \
    +----------------------------|-----------------------------+ |
	  |              |             |                             | |
	  |  Feeds       |   Articles  |            <Article>        | |
	  |              |             |                             | |
	  |              |             |                             | |
	  |              |             |                             | |
	  |              |             |                             | |
	  |              |             |                             | |
	  |              |             |                             | |
    +----------------------------|-----------------------------+ |
                                  \                             /
                                    ---------------------------

Large: content width is 125%, screen shows 3 columns at a time

     ----------------------------------------------
   /                                               \
   | +---------------------------------------------|-----------+
	 | |              |              |               |           |
	 | |  Feeds       |   Articles   |               |           |
	 | |              |              |               |           |
	 | |              |              |               |           |
	 | |              |              |               |           |
	 | |              |              |               |           |
	 | |              |              |               |           |
	 | |              |              |               |           |
   | +---------------------------------------------|-----------+
    \                                             /
      --------------------------------------------

                    --------------------------------------------
                  /                                              \
   +--------------|--------------------------------------------+ |
	 |              |              |                             | |
	 |  Feeds       |   Articles   |  Article                    | |
	 |              |              |                             | |
	 |              |              |                             | |
	 |              |              |                             | |
	 |              |              |                             | |
	 |              |              |                             | |
	 |              |              |                             | |
   +--------------|--------------------------------------------+ |
                  \                                             /
                    --------------------------------------------

X-Large:

     -----------------------------------------------------------
   /                                                             \
   | +---------------------------------------------------------+ |
	 | |              |              |                           | |
	 | |  Feeds       |   Articles   |  Article                  | |
	 | |              |              |                           | |
	 | |              |              |                           | |
	 | |              |              |                           | |
	 | |              |              |                           | |
	 | |              |              |                           | |
	 | |              |              |                           | |
   | +---------------------------------------------------------+ |
    \                                                           /
      ---------------------------------------------------------
-->

<div
	class="fixed h-full w-full opacity-0 transition-opacity duration-300"
	class:opacity-100={ready}
	bind:this={rootRef}
>
	<div
		class={cls`
			fixed
			left-0
			top-0
			z-10
			h-9
			w-full
			border-b
			border-border-light
			sm:h-full
			sm:w-9
			sm:border-b-0
			sm:border-r
			dark:border-border-dark
		`}
	>
		<Header
			articleId={$page.data.articleId}
			feedId={$page.data.feedId}
			class="sm:flex-col"
		/>
	</div>

	<div
		class={cls`
		flex
		h-full
		flex-row
		pt-9
		sm:ml-9
		sm:pt-0
	`}
	>
		<div
			class={cls`
				flex
				min-w-[300%]
				max-w-[300%]
				flex-row
				overflow-hidden
				bg-white
				transition-transform
				duration-500
				sm:min-w-[calc(100%+600px)]
				sm:max-w-[calc(100%+600px)]
				lg:min-w-[calc(100%+300px)]
				lg:max-w-[calc(100%+300px)]
				xl:min-w-[calc(100%)]
				xl:max-w-[calc(100%)]
				dark:bg-black
			`}
			class:translate-x-[-33.3333%]={$page.data.feedId && !$page.data.articleId}
			class:translate-x-[-66.6667%]={$page.data.articleId}
			class:sm:translate-x-[0]={$page.data.feedId && !$page.data.articleId}
			class:sm:translate-x-[-600px]={$page.data.articleId}
			class:lg:translate-x-[-300px]={$page.data.articleId}
			class:xl:translate-x-0={$page.data.articleId}
			on:touchstart={handleTouchStart}
			on:touchend={handleTouchEnd}
			on:touchmove={handleTouchMove}
		>
			<div
				class={cls`
					flex
					w-[33.3333%]
					flex-shrink-0
					flex-col
					justify-between
					border-border-light
					sm:w-[300px]
					sm:border-r
					dark:border-border-dark
				`}
			>
				<FeedsList
					feeds={data.feeds}
					{selectedFeedIds}
					{selectedGroupId}
					articleFilter={$articleFilter}
					feedId={$page.data.feedId}
					feedStats={data.feedStats}
					feedGroups={data.feedGroups}
				/>

				<div class="grid grid-cols-2 gap-3 p-3">
					<Button
						class="whitespace-nowrap"
						on:click={() => ($managingFeeds = true)}>Manage Feeds</Button
					>

					<Select
						class="[text-align-last:center]"
						value={$articleFilter}
						onChange={updateArticleFilter}
					>
						<option value="unread">Unread</option>
						<option value="all">All</option>
					</Select>
				</div>
			</div>

			<slot></slot>
		</div>

		{#if $managingFeeds}
			<FeedManager
				feeds={data.feeds}
				feedGroups={data.feedGroups}
				onClose={() => ($managingFeeds = false)}
			/>
		{/if}
	</div>
</div>
