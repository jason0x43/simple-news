<script lang="ts">
	import { slide } from "../transition";
	import FeedsList from "./FeedsList.svelte";
</script>

<div
	class="sidebar"
	in:slide={{ direction: "right", duration: 250 }}
	out:slide={{ direction: "right", duration: 250 }}
>
	<div class="sidebar-feeds">
		<FeedsList />
	</div>
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
		top: 0;
		left: 0;
		z-index: 30;
		border-right: 1px solid var(--border);
		position: absolute;
	}

	.sidebar-feeds {
		flex-grow: 1;
		flex-shrink: 1;
		overflow: auto;
	}
</style>
