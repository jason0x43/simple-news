<script lang="ts">
	let {
		variant = "normal",
		disabled = false,
		type = "button",
		class: className = "",
		onclick,
		children,
	}: {
		variant?: "invisible" | "normal";
		disabled?: boolean;
		type?: "button" | "submit";
		class?: string;
		children?: import("svelte").Snippet;
		onclick?: () => void;
		[key: string]: unknown;
	} = $props();
</script>

<button
	{onclick}
	{type}
	{disabled}
	class={className}
	class:disabled
	class:normal={variant === "normal"}
>
	{@render children?.()}
</button>

<style lang="postcss">
	button {
		@apply flex items-center justify-center rounded-md text-xs;
	}

	.normal {
		@apply border border-border-light bg-hover-light px-2 py-1 font-bold dark:border-border-dark dark:bg-hover-dark;
	}

	.disabled {
		@apply text-disabled-light dark:text-disabled-dark;
	}
</style>
