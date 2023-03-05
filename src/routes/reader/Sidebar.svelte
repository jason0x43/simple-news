<script lang="ts">
	import { getAppContext } from '$lib/contexts';
	import { slide } from '$lib/transition';
	import Button from '$lib/components/Button.svelte';
	import FeedsList from './FeedsList.svelte';
	import Select from '$lib/components/Select.svelte';

	const { articleFilter, sidebarVisible, managingFeeds, selectedFeedIds } =
		getAppContext().stores;

	let ref: HTMLElement;

	function handleClick(event: MouseEvent) {
		if (
			$selectedFeedIds.length > 0 &&
			(!event.target || !ref.contains(event.target as HTMLElement))
		) {
			$sidebarVisible = false;
		}
	}
</script>

<svelte:window on:click={handleClick} />

<div
	class="sidebar"
	in:slide={{ direction: 'right' }}
	out:slide={{ direction: 'right' }}
	bind:this={ref}
>
	<div class="sidebar-feeds">
		<FeedsList onSelect={() => ($sidebarVisible = false)} />
	</div>
	<div class="sidebar-controls">
		<Button on:click={() => ($managingFeeds = true)}>Manage Feeds</Button>
		<Select bind:value={$articleFilter}>
			<option value="unread">Unread</option>
			<option value="all">All</option>
			<option value="saved">Saved</option>
		</Select>
	</div>
</div>

<style>
	.sidebar {
		background: var(--highlight);
		color: var(--highlight-text);
		width: var(--sidebar-width);
		display: flex;
		height: 100%;
		flex-direction: column;
		position: absolute;
		left: 0;
		z-index: 30;
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
