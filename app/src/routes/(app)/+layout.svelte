<script lang="ts">
	import "../../app.css";
	import Header from "$lib/components/Header.svelte";
	import { setAppContext } from "$lib/context";
	import { readonly, writable } from "svelte/store";
	import FeedManager from "$lib/components/FeedManager.svelte";
	import FeedsList from "$lib/components/FeedsList.svelte";
	import Button from "$lib/components/Button.svelte";
	import Select from "$lib/components/Select.svelte";
	import { page } from "$app/stores";
	import { cls } from "$lib/cls";

	export let data;

	let rootRef: HTMLElement | undefined;

	const root = writable<HTMLElement>();
	setAppContext("root", readonly(root));

	const managingFeeds = writable<boolean>(false);
	setAppContext("managingFeeds", managingFeeds);

	const updatedArticleIds = writable<Set<string>>(new Set());
	setAppContext("updatedArticleIds", updatedArticleIds);

	let selectedFeedIds: string[] = [];
	let selectedGroupId: string | undefined;

	$: {
		const feedId = $page.data.feedId;
		selectedGroupId = undefined;

		if (feedId && feedId !== "saved") {
			const [type, id] = feedId.split("-");
			if (type === "group") {
				const group = data.feedGroups.find((g) => g.id === id);
				selectedFeedIds = group?.feed_ids ?? [];
				selectedGroupId = id;
			} else {
				selectedFeedIds = [id];
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
	class={cls`
		fixed
		bottom-0
		left-0
		right-0
		top-0
		flex
		flex-col
		overflow-hidden
	`}
	bind:this={rootRef}
>
	<Header
		feedId={$page.data.feedId}
		feeds={data.feeds}
		feedGroups={data.feedGroups}
	/>

	<div
		class={cls`
				flex
				w-[300%]
				flex-auto
				flex-row
				overflow-hidden
				bg-white
				transition-transform
				duration-500
				sm:w-[calc(100vw+600px)]
				dark:bg-black
			`}
		class:translate-x-[-33.3333%]={$page.data.feedId && $page.data.articleId}
		class:translate-x-[-66.6667%]={$page.data.articleId}
		class:sm:translate-x-[0]={$page.data.feedId && !$page.data.articleId}
		class:sm:translate-x-[-600px]={$page.data.articleId}
		class:lg:translate-x-[-300px]={$page.data.articleId}
		on:touchstart={handleTouchStart}
		on:touchend={handleTouchEnd}
		on:touchmove={handleTouchMove}
	>
		<div
			class={cls`
				flex
				w-[33.3333%]
				flex-col
				justify-between
				bg-gray-light
				sm:w-[300px]
				dark:bg-gray-x-dark
			`}
		>
			<FeedsList
				feeds={data.feeds}
				{selectedFeedIds}
				{selectedGroupId}
				articleFilter={data.articleFilter}
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
					bind:value={data.articleFilter}
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
