<script lang="ts">
	import { getAppContext } from '$lib/contexts';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	export let target: HTMLElement | null | undefined = undefined;
	export let anchor: { x?: number; y?: number } | 'modal' | undefined =
		undefined;
	export let duration: { in?: number; out?: number } | number | undefined =
		undefined;
	export let zIndex = 50;

	let ref: HTMLElement;
	let style: string[] = [];
	let inDuration = 0;
	let outDuration = 0;

	$: {
		if (anchor && typeof anchor === 'object') {
			const anchorY = typeof anchor.y === 'number' ? `${anchor.y}px` : '50%';
			const anchorX = typeof anchor.x === 'number' ? `${anchor.x}px` : '50%';
			const translateY = typeof anchor.y === 'number' ? '0' : '-50%';
			const translateX = typeof anchor.x === 'number' ? '0' : '-50%';
			style = [
				`top:${anchorY}`,
				`left:${anchorX}`,
				`transform:translate(${translateX},${translateY})`
			];
		} else if (!anchor) {
			style = [`top:50%`, `left:50%`, `transform:translate(-50%,-50%)`];
		} else {
			style = [];
		}

		style.push(`z-index:${zIndex}`);
	}

	$: {
		if (typeof duration === 'number') {
			inDuration = duration;
		} else if (typeof duration?.in === 'number') {
			inDuration = duration.in;
		} else if (anchor === 'modal') {
			inDuration = 150;
		}
	}

	$: {
		if (typeof duration === 'number') {
			outDuration = duration;
		} else if (typeof duration?.out === 'number') {
			outDuration = duration.out;
		} else if (anchor === 'modal') {
			outDuration = 150;
		}
	}

	function handleClick(event: Event) {
		// If this is a modal, consume click events on the background
		if (anchor === 'modal' && event instanceof MouseEvent) {
			event.stopPropagation();
		}
	}

	const root = getAppContext('root');

	onMount(() => {
		const elem = target ?? root ?? window.document?.body;
		elem?.append(ref);
	});
</script>

<div
	class="portal"
	class:modal={anchor === 'modal'}
	on:click={handleClick}
	on:keypress={handleClick}
	bind:this={ref}
	style={style.join(';')}
	in:fade={{ duration: inDuration }}
	out:fade={{ duration: outDuration }}
>
	<slot />
</div>

<style>
	.portal {
		position: absolute;
		z-index: 200;
	}

	.modal {
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(128, 128, 128, 0.85);
	}
</style>
