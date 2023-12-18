<script lang="ts">
	import "./app.css";
	import { init as initRouter } from "./lib/router";
	import ArticlesList from "./lib/components/ArticlesList.svelte";
	import Header from "./lib/components/Header.svelte";
	import Sidebar from "./lib/components/Sidebar.svelte";
	import {
		sidebarVisible,
		init as initState,
		article,
		feed,
		feedId,
		displayType,
		managingFeeds,
	} from "./lib/state";
	import { setAppContext } from "./lib/context";
	import { readonly, writable } from "svelte/store";
	import { slide } from "./lib/transition";
	import ArticleView from "./lib/components/ArticleView.svelte";
	import FeedManager from "./lib/components/FeedManager.svelte";

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
		h-full
		max-w-full
		overflow-y-auto
		overflow-x-hidden
		relative
		bg-white
		dark:bg-black
		flex
		flex-row
	`}
	>
		{#if $feedId}
			<ArticlesList />
		{/if}

		{#if $sidebarVisible}
			<Sidebar />
		{/if}

		{#if article && feed}
			<ArticleView />
		{/if}

		{#if $managingFeeds}
			<FeedManager />
		{/if}
	</div>
</div>
