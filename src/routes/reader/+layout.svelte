<script lang="ts">
	import Header from './Header.svelte';
	import { onMount } from 'svelte';
	import { getAppContext, setReaderContext } from '$lib/contexts';
	import ManageFeeds from './ManageFeeds.svelte';
	import Sidebar from './Sidebar.svelte';
	import { browser } from '$app/environment';
	import { put as putSessionData } from '../api/session';
	import { get as getFeedStats } from '../api/feedstats';

	export let data;

	const {
		articleFilter,
		sidebarVisible,
		feeds,
		feedGroups,
		feedStats,
		managingFeeds
	} = getAppContext().stores;

	$: $feeds = data.feeds ?? [];
	$: $feedStats = data.feedStats ?? {};
	$: $feedGroups = data.feedGroups ?? [];
	$: $articleFilter = data.articleFilter ?? 'unread';

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
			putSessionData({ articleFilter: value }).catch((error) => {
				console.warn('Error updating session data:', error);
			});
		});
	}

	onMount(() => {
		const interval = setInterval(async () => {
			try {
				const resp = await getFeedStats();
				$feedStats = resp;
			} catch (error) {
				console.warn('Error updating feedstats');
			}
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
