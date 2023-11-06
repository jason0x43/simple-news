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

<div class="root" bind:this={rootRef}>
	<div class="header">
		<Header />
	</div>

	<div class="content">
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

<style>
	.root {
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica,
			Arial, sans-serif;
		font-size: var(--font-size);
		font-weight: var(--font-weight);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		color: var(--foreground);
		position: fixed;
		width: 100%;
		background: var(--background);
	}

	.header {
		background: var(--matte);
		position: relative;
		z-index: 1;
	}

	.content {
		height: 100%;
		max-width: 100%;
		overflow-y: auto;
		overflow-x: hidden;
		position: relative;
		background: var(--background);
		display: flex;
		flex-direction: row;
	}
</style>
