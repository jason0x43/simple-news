<script lang="ts">
	let {
		value = $bindable(),
		variant = "normal",
		disabled = false,
		onChange = undefined,
		class: className = "",
		name,
		children,
	}: {
		value: string;
		name?: string;
		variant?: "editable" | "invisible" | "normal";
		disabled?: boolean;
		onChange?: ((value: string) => void) | undefined;
		class?: string;
		children?: import("svelte").Snippet;
	} = $props();
</script>

<select
	class={className}
	class:normal={variant === "normal"}
	class:px-1={variant === "editable"}
	class:disabled-not-editable={disabled && variant !== "editable"}
	class:normal-editable={variant === "normal" ||
		(variant === "editable" && !disabled)}
	class:disabled-editable={variant === "editable" && disabled}
	bind:value
	onchange={(event) => {
		onChange?.(event.currentTarget.value);
	}}
	{disabled}
	{name}
>
	{@render children?.()}
</select>

<style lang="postcss">
	select {
		@apply min-w-0 appearance-none rounded-md border;
	}
	.normal {
		@apply px-2 py-1 text-xs font-bold;
	}
	.editable {
		@apply border-transparent bg-transparent px-1 py-1;
	}
	.disabled {
		@apply text-disabled-light dark:text-disabled-dark;
	}
	.disabled-editable {
		@apply border-transparent bg-transparent;
	}
	.disabled-not-editable {
		@apply text-disabled-light dark:text-disabled-dark;
	}
	.normal-editable {
		@apply border-border-light bg-hover-light dark:border-border-dark dark:bg-hover-dark;
	}
</style>
