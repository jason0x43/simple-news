<script lang="ts">
	import Header from './Header.svelte';
	import { onMount } from 'svelte';
	import { getAppContext, setReaderContext } from '$lib/contexts';
	import ManageFeeds from './ManageFeeds.svelte';
	import Sidebar from './Sidebar.svelte';
	import { storeValue } from '$lib/util';
	import type { ArticleFilter, GetFeedStatsResponse } from '$lib/types';
	import { responseJson } from '$lib/kit';

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

	onMount(() => {
		const interval = setInterval(async () => {
			try {
				const resp = await responseJson<GetFeedStatsResponse>(
					fetch('/api/feedstats')
				);
				$feedStats = resp;
			} catch (error) {
				console.warn('Error updating feedstats');
			}
		}, 600_000);

		articleFilter.subscribe((val) => {
			storeValue<ArticleFilter>('simple-news:articleFilter', val);
		});

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
