<script lang="ts">
	import "./app.css";
	import { init as initRouter } from "./lib/router";
	import ArticlesList from "./lib/components/ArticlesList.svelte";
	import Header from "./lib/components/Header.svelte";
	import Login from "./lib/components/Login.svelte";
	import {
		init as initState,
		article,
		feedId,
		managingFeeds,
		user,
		articleFilter,
	} from "./lib/state";
	import { setAppContext } from "./lib/context";
	import { readonly, writable } from "svelte/store";
	import ArticleView from "./lib/components/ArticleView.svelte";
	import FeedManager from "./lib/components/FeedManager.svelte";
	import Activity from "./lib/components/Activity.svelte";
	import FeedsList from "./lib/components/FeedsList.svelte";
	import Button from "./lib/components/Button.svelte";
	import Select from "./lib/components/Select.svelte";

	initRouter();
	initState();

	let rootRef: HTMLElement | undefined;
	const root = writable<HTMLElement>();
	setAppContext("root", readonly(root));

	$: {
		if (rootRef) {
			$root = rootRef;
		}
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

{#if $user}
	<div
		class={`
		fixed
		top-0
		left-0
		bottom-0
		right-0
		flex
		flex-col
		overflow-hidden
	`}
		bind:this={rootRef}
	>
		<Header />

		<div
			class={`
				bg-white
				dark:bg-black
				flex-auto
				overflow-hidden
				w-[300%]
				sm:w-[calc(100vw+600px)]
				flex
				flex-row
				divide-x
				divide-black/10
				dark:divide-white/10
				transition-transform
				duration-500
			`}
			class:translate-x-[-33.3333%]={$feedId && !$article}
			class:translate-x-[-66.6667%]={$article}
			class:sm:translate-x-[0]={$feedId && !$article}
			class:sm:translate-x-[-600px]={$article}
			class:lg:translate-x-[-300px]={$article}
		>
			<div class="flex flex-col justify-between w-[33.3333%] sm:w-[300px]">
				<FeedsList />

				<div class="grid grid-cols-2 p-3 gap-3">
					<Button on:click={() => ($managingFeeds = true)}>Manage Feeds</Button>
					<Select class="[text-align-last:center]" bind:value={$articleFilter}>
						<option value="unread">Unread</option>
						<option value="all">All</option>
					</Select>
				</div>
			</div>

			<div class="flex w-[33.3333%] sm:w-[300px]">
				<ArticlesList />
			</div>

			<div class="flex w-[33.3333%] sm:w-[100vw] lg:w-[calc(100vw-300px)]">
				<ArticleView />
			</div>
		</div>

		{#if $managingFeeds}
			<FeedManager />
		{/if}
	</div>
{:else if $user !== undefined}
	<Login />
{:else}
	<div class="flex flex-row items-center justify-center h-screen">
		<Activity size={60} />
	</div>
{/if}
