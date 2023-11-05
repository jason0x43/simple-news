<script lang="ts">
	import { articleFilter, managingFeeds } from "../state";
	import { slide } from "../transition";
	import Button from "./Button.svelte";
	import FeedsList from "./FeedsList.svelte";
	import Select from "./Select.svelte";
</script>

<div
	class="sidebar"
	in:slide={{ direction: "right", duration: 250 }}
	out:slide={{ direction: "right", duration: 250 }}
>
	<div class="sidebar-feeds">
		<FeedsList />
	</div>
	<div class="sidebar-controls">
		<Button on:click={() => ($managingFeeds = true)}>Manage Feeds</Button>
		<Select bind:value={$articleFilter}>
			<option value="unread">Unread</option>
			<option value="all">All</option>
		</Select>
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

	.sidebar-controls {
		flex-grow: 0;
		flex-shrink: 0;
		display: flex;
		justify-content: center;
		margin: 1rem;
		margin-top: 0.5rem;
		gap: var(--gap);
	}
</style>
