<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { createStores } from '$lib/stores';
	import { setAppContext } from '$lib/contexts';
	import Toast from '$lib/components/Toast.svelte';

	let ref: HTMLElement;
	const stores = createStores();

	setAppContext({
		getRoot: () => ref,
		stores
	});

	const { displayType } = stores;

	onMount(() => {
		const matcher = window.matchMedia('(max-width: 800px)');
		const listener = (event: MediaQueryListEvent) => {
			$displayType = event.matches ? 'mobile' : 'desktop';
		};
		matcher.addEventListener('change', listener);
		$displayType = matcher.matches ? 'mobile' : 'desktop';

		return () => {
			matcher.removeEventListener('change', listener);
		};
	});
</script>

<div id="root" bind:this={ref}>
	<slot />
	<Toast />
</div>

<style>
	#root {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		font-family: sans-serif;
		font-size: var(--font-size);
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
		color: var(--foreground);
		position: fixed;
		width: 100%;
		background: var(--background);
	}
</style>
