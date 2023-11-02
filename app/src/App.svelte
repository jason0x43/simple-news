<script lang="ts">
	import Header from "./lib/components/Header.svelte";
	import Sidebar from "./lib/components/Sidebar.svelte";
	import { sidebarVisible } from "./lib/stores";
</script>

<div class="header">
	<Header />
</div>

<div class="content">
	{#if $sidebarVisible}
		<Sidebar />
	{/if}
</div>

<style>
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
