<script lang="ts">
	import CloseIcon from "../icons/Close.svelte";
	import Activity from "./Activity.svelte";
	import { fade } from "svelte/transition";

	let {
		title = undefined,
		onClose = undefined,
		busy = false,
		children,
	}: {
		title?: string | undefined;
		onClose?: (() => void) | undefined;
		busy?: boolean;
		children?: import("svelte").Snippet;
	} = $props();
</script>

<div
	class="
		dialog
		flex
		h-full
		w-full
		flex-col
		overflow-hidden
		bg-white
		sm:max-h-[80%]
		sm:max-w-[80%]
		md:rounded-md
		md:shadow-md
		dark:bg-black
	"
>
	{#if title || onClose}
		<!-- title -->
		<div
			class="
				flex
				items-center
				justify-between
				border-b
				border-border-light
				bg-hover-light
				px-3
				py-2
				dark:border-border-dark
				dark:bg-hover-dark
			"
		>
			<h4>{title}</h4>
			{#if onClose}
				<button
					class="rounded-md"
					onclick={(event) => {
						event.stopPropagation();
						onClose?.();
					}}
				>
					<CloseIcon size={22} />
				</button>
			{/if}
		</div>
	{/if}
	<div class="content relative flex overflow-hidden">
		{@render children?.()}
		{#if busy}
			<div
				class="
					bg-background
					absolute
					bottom-0
					left-0
					right-0
					top-0
					z-10
					flex
					items-center
					justify-center
					opacity-75
				"
				in:fade={{ duration: 150 }}
				out:fade={{ duration: 150 }}
			>
				<Activity />
			</div>
		{/if}
	</div>
</div>
