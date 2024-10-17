<script lang="ts">
	export let variant: "invisible" | "normal" = "normal";
	export let disabled = false;
	export let type: "button" | "submit" = "button";

	let className = "";
	export { className as class };
</script>

<button
	on:click
	{type}
	{disabled}
	class={className}
	class:disabled
	class:normal={variant === "normal"}
	{...$$restProps}
>
	<slot />
</button>

<style lang="postcss">
	button {
		@apply flex
			items-center
			justify-center
			rounded-md
			text-xs;
	}

	.normal {
		@apply border
			border-border-light
			bg-hover-light
			px-2
			py-1
			font-bold
			dark:border-border-dark
			dark:bg-hover-dark;
	}

	.disabled {
		@apply text-disabled-light dark:text-disabled-dark;
	}
</style>
