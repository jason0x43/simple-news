<script lang="ts">
	import "./app.css";
	import { path, params, resolve } from "elegua";
	import Header from "./lib/components/Header.svelte";
	import Sidebar from "./lib/components/Sidebar.svelte";
	import { feedId, loadData, sidebarVisible } from "./lib/stores";

	$: {
		if (resolve($path, "/reader/:feedgroup")) {
			$feedId = $params["feedgroup"];
		}
	}

	loadData().catch((err) => {
		console.error(err);
	});
</script>

<div class="root">
	<div class="header">
		<Header />
	</div>

	<div class="content">
		{#if $sidebarVisible}
			<Sidebar />
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
		height: 100%;
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
	}
</style>
