<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { getAppContext, setReaderContext } from '$lib/contexts';
	import ManageFeeds from '$lib/components/ManageFeeds.svelte';
	import { put } from '$lib/request';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { browser } from '$app/environment';
	import type { LayoutData } from './$types';
	import type { UpdateSessionRequest } from '$lib/types';

	export let data: LayoutData;

	const {
		articleFilter,
		sidebarVisible,
		feeds,
		feedGroups,
		feedStats,
		managingFeeds
	} = getAppContext().stores;

	$: {
		$feeds = data.feeds ?? [];
		$feedStats = data.feedStats ?? {};
		$feedGroups = data.feedGroups ?? [];
		$articleFilter = data.articleFilter ?? 'unread';
	}

	const titleListeners = new Set<() => void>();

	function handleTitlePress() {
		titleListeners.forEach((listener) => listener());
	}

	function onTitlePress(listener: () => void) {
		titleListeners.add(listener);
		return () => {
			titleListeners.delete(listener);
		};
	}

	setReaderContext({
		onTitlePress
	});

	if (browser) {
		articleFilter.subscribe((value) => {
			put<UpdateSessionRequest>('/api/session', { articleFilter: value }).catch(
				(error) => {
					console.warn('Error updating session data:', error);
				}
			);
		});
	}

	onMount(() => {
		const interval = setInterval(() => {
			invalidate('reader:feedstats');
		}, 600_000);

		return () => {
			clearInterval(interval);
		};
	});
</script>

<div class="header">
	<Header onTitlePress={handleTitlePress} />
</div>

<div class="content">
	{#if $sidebarVisible}
		<Sidebar />
	{/if}

	<slot />

	{#if $managingFeeds}
		<ManageFeeds />
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
