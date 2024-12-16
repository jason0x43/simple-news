<script lang="ts">
	import { onMount } from "svelte";
	import { fade } from "svelte/transition";
	import { getAppContext } from "../context";

	let {
		target = undefined,
		anchor = undefined,
		duration = undefined,
		zIndex = undefined,
		children,
	}: {
		target?: HTMLElement | null | undefined;
		anchor?: "modal" | { x?: number; y?: number } | undefined;
		duration?: number | { in?: number; out?: number } | undefined;
		zIndex?: number | undefined;
		children?: import("svelte").Snippet;
	} = $props();

	const root = getAppContext("root");

	let ref: HTMLElement | undefined = $state();
	let style: string[] = $derived.by(() => {
		let rect = ref?.getBoundingClientRect() ?? { height: 0, width: 0 };
		let style: string[] = [];

		if (typeof window === 'undefined') {
			return style;
		}

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

		return style;
	});

	let inDuration = $derived(
		typeof duration === "number"
			? duration
			: typeof duration?.in === "number"
				? duration.in
				: anchor === "modal"
					? 150
					: 0,
	);

	let outDuration = $derived(
		typeof duration === "number"
			? duration
			: typeof duration?.out === "number"
				? duration.out
				: anchor === "modal"
					? 150
					: 0,
	);

	function handleClick(event: Event) {
		// If this is a modal, consume click events on the background
		if (anchor === "modal" && event instanceof MouseEvent) {
			event.stopPropagation();
		}
	}

	onMount(() => {
		const elem = target ?? $root ?? window.document?.body;
		elem?.append(ref!);

		const rect = ref!.getBoundingClientRect();
		if (rect.right > window.innerWidth) {
			ref!.style.left = `${window.innerWidth - rect.width}px`;
		}
		if (rect.bottom > window.innerHeight) {
			ref!.style.top = `${window.innerHeight - rect.height}px`;
		}
	});

	// Manually remove the portal because it isn't always removed in dev mode when
	// when HMR is enabled.
	$effect(() => {
		return () => {
			ref?.remove();
		};
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="absolute left-[50%] top-[50%] z-50"
	class:modal={anchor === "modal"}
	onclick={handleClick}
	onkeypress={handleClick}
	bind:this={ref}
	style={style.join(";")}
	in:fade={{ duration: inDuration }}
	out:fade={{ duration: outDuration }}
>
	{@render children?.()}
</div>

<style lang="postcss">
	.modal {
		@apply bottom-0 left-0 right-0 top-0 flex items-center justify-center bg-modal-light bg-opacity-70 backdrop-blur dark:bg-modal-dark dark:bg-opacity-70;
	}
</style>
