<script lang="ts">
	import { setAppContext } from '$lib/contexts';
	import { responseJson } from '$lib/kit';
	import type { ArticleFilter, GetFeedStatsResponse } from '$lib/types';
	import { loadValue, storeValue } from '$lib/util';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import Header from './Header.svelte';
	import ManageFeeds from './ManageFeeds.svelte';
	import Sidebar from './Sidebar.svelte';

	export let data;

	// The filter applied to the set of loaded article headings
	const articleFilter = setAppContext(
		'articleFilter',
		writable(loadValue('simple-news:articleFilter') ?? 'unread')
	);

	// True if the sidebar should be visible
	const sidebarVisible = setAppContext('sidebarVisible', writable());

	// True if the feed management UI should be active
	const managingFeeds = setAppContext('managingFeeds', writable(false));

	// The user's subscribed feeds
	const feeds = setAppContext('feeds', writable([]));

	// Stats for the user's feeds
	const feedStats = setAppContext(
		'feedStats',
		writable({ feeds: {}, saved: 0 })
	);

	// The user's feed groups
	const feedGroups = setAppContext('feedGroups', writable([]));

	// What the app is being displayed on
	const displayType = setAppContext('displayType', writable('desktop'));

	$: $feeds = data.feeds ?? [];
	$: $feedStats = data.feedStats ?? {};
	$: $feedGroups = data.feedGroups ?? [];

	const titleListeners = new Set<() => void>();

	function handleTitlePress() {
		titleListeners.forEach((listener) => listener());
	}

	setAppContext('onTitlePress', (listener: () => void) => {
		titleListeners.add(listener);
		return () => {
			titleListeners.delete(listener);
		};
	});

	onMount(() => {
		const matcher = window.matchMedia('(max-width: 800px)');
		const listener = (event: MediaQueryListEvent) => {
			$displayType = event.matches ? 'mobile' : 'desktop';
		};
		matcher.addEventListener('change', listener);
		$displayType = matcher.matches ? 'mobile' : 'desktop';

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
			matcher.removeEventListener('change', listener);
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
