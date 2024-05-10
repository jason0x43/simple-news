<script lang="ts">
	export let selected = false;
	export let nested = false;
</script>

<div
	class="list-item pl-9"
	class:selected
	class:not-selected={!selected}
	class:pl-9={nested}
	class:pl-2={!nested}
>
	<slot />
</div>

<style lang="postcss">
	.selected {
		@apply bg-hover-light dark:bg-hover-dark;
	}

	.not-selected {
		@apply hover:bg-hover-light dark:hover:bg-hover-dark;
	}

	.list-item {
		@apply mx-2 flex flex-row items-center pr-2 rounded-md;
	}
</style>
