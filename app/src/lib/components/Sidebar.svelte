<script lang="ts">
	import { slide } from "svelte/transition";
</script>

<div class="sidebar" in:slide={{ axis: "x" }} out:slide={{ axis: "x" }}>
	<div class="sidebar-feeds">Feeds</div>
</div>

<style>
	.sidebar {
		background: var(--background);
		color: var(--highlight);
		width: var(--sidebar-width);
		display: flex;
		height: 100%;
		flex-direction: column;
		position: absolute;
		left: 0;
		z-index: 30;
		border-right: 1px solid var(--border);
	}

	.sidebar-feeds {
		flex-grow: 1;
		flex-shrink: 1;
		overflow: auto;
	}
</style>
