<script lang="ts">
	let {
		selected = false,
		nested = false,
		children,
	}: {
		selected?: boolean;
		nested?: boolean;
		children?: import("svelte").Snippet;
	} = $props();
</script>

<div
	class="list-item border border-transparent pl-9"
	class:selected
	class:not-selected={!selected}
	class:pl-9={nested}
	class:pl-2={!nested}
>
	{@render children?.()}
</div>

<style lang="postcss">
	.selected {
		@apply border-gray-light bg-hover-light dark:border-gray-dark dark:bg-hover-dark;
	}

	.not-selected {
		@apply hover:bg-hover-light dark:hover:bg-hover-dark;
	}

	.list-item {
		@apply mx-2 flex flex-row items-center rounded-md pr-2;
	}
</style>
