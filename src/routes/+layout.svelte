<script lang="ts">
	import '../app.css';
	import Toast from '$lib/components/Toast.svelte';
	import { setAppContext } from '$lib/contexts';

	let ref: HTMLElement;

	$: {
		setAppContext('root', ref);
	}
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
		font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica,
			Arial, sans-serif;
		font-size: var(--font-size);
		font-weight: var(--font-weight);
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
