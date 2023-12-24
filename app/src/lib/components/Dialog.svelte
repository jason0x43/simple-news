<script lang="ts">
	import CloseIcon from "../icons/Close.svelte";
	import Activity from "./Activity.svelte";
	import { fade } from "svelte/transition";

	export let title: string | undefined = undefined;
	export let onClose: (() => void) | undefined = undefined;
	export let busy = false;
</script>

<div
	class={`
		dialog
		bg-white
		dark:bg-black
		dark:text-white
		md:rounded-md
		md:shadow-md
		flex
		flex-col
		overflow-hidden
		w-full
		md:max-w-[80%]
		md:max-h-[80%]
	`}
>
	{#if title || onClose}
		<!-- title -->
		<div
			class={`
				bg-gray-light
				dark:bg-gray-dark
				px-3
				py-2
				flex
				justify-between
				items-center
			`}
		>
			<h4 class="dark:text-white">{title}</h4>
			{#if onClose}
				<button
					class="rounded-md"
					on:click={(event) => {
						event.stopPropagation();
						onClose?.();
					}}
				>
					<CloseIcon size={22} />
				</button>
			{/if}
		</div>
	{/if}
	<div class="content flex overflow-hidden relative">
		<slot />
		{#if busy}
			<div
				class={`
					absolute
					z-10
					top-0
					left-0
					bottom-0
					right-0
					bg-background
					opacity-75
					flex
					items-center
					justify-center
				`}
				in:fade={{ duration: 150 }}
				out:fade={{ duration: 150 }}
			>
				<Activity />
			</div>
		{/if}
	</div>
</div>
