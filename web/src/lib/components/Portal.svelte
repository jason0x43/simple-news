<script lang="ts">
	import { onMount } from "svelte";
	import { fade } from "svelte/transition";
	import { getAppContext } from "../context";
	import { browser } from "$app/environment";

	export let target: HTMLElement | null | undefined = undefined;
	export let anchor: "modal" | { x?: number; y?: number } | undefined =
		undefined;
	export let duration: number | { in?: number; out?: number } | undefined =
		undefined;
	export let zIndex: number | undefined = undefined;

	let ref: HTMLElement;
	let style: string[] = [];
	let inDuration = 0;
	let outDuration = 0;

	$: {
		if (browser) {
			style = [];
			let rect = ref?.getBoundingClientRect() ?? { height: 0, width: 0 };

			if (anchor && typeof anchor === "object") {
				let tx = "-50%";
				let ty = "-50%";

				if (typeof anchor.y === "number") {
					let y = Math.min(anchor.y, window.innerHeight - rect.height);
					style.push(`top:${y}px`);
					ty = "0";
				}
				if (typeof anchor.x === "number") {
					let x = Math.min(anchor.x, window.innerWidth - rect.width);
					style.push(`left:${x}px`);
					tx = "0";
				}
				style.push(`transform:translate(${tx},${ty})`);
			}

			if (zIndex !== undefined) {
				style.push(`z-index:${zIndex}`);
			}
		}
	}

	$: {
		if (typeof duration === "number") {
			inDuration = duration;
		} else if (typeof duration?.in === "number") {
			inDuration = duration.in;
		} else if (anchor === "modal") {
			inDuration = 150;
		}
	}

	$: {
		if (typeof duration === "number") {
			outDuration = duration;
		} else if (typeof duration?.out === "number") {
			outDuration = duration.out;
		} else if (anchor === "modal") {
			outDuration = 150;
		}
	}

	function handleClick(event: Event) {
		// If this is a modal, consume click events on the background
		if (anchor === "modal" && event instanceof MouseEvent) {
			event.stopPropagation();
		}
	}

	const root = getAppContext("root");

	onMount(() => {
		const elem = target ?? $root ?? window.document?.body;
		elem?.append(ref);

		const rect = ref.getBoundingClientRect();
		if (rect.right > window.innerWidth) {
			ref.style.left = `${window.innerWidth - rect.width}px`;
		}
		if (rect.bottom > window.innerHeight) {
			ref.style.top = `${window.innerHeight - rect.height}px`;
		}
	});
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="absolute left-[50%] top-[50%] z-50"
	class:modal={anchor === "modal"}
	on:click={handleClick}
	on:keypress={handleClick}
	bind:this={ref}
	style={style.join(";")}
	in:fade={{ duration: inDuration }}
	out:fade={{ duration: outDuration }}
>
	<slot />
</div>

<style lang="postcss">
	.modal {
		@apply bottom-0
			left-0
			right-0
			top-0
			flex
			items-center
			justify-center
			bg-modal-light
			bg-opacity-70
			backdrop-blur
			dark:bg-modal-dark
			dark:bg-opacity-70;
	}
</style>
