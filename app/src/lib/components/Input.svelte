<script lang="ts">
	export let ref: HTMLInputElement | undefined = undefined;
	export let value: string = "";
	export let disabled = false;
	export let variant: "normal" | "invisible" | "editable" = "normal";

	let className = "";
	export { className as class };
</script>

<input
	class={`
		placeholder-disabled
		appearance-none
		overflow-ellipsis
		rounded-md
		border
		font-normal
		dark:placeholder-disabled-dark
		${className}
	`}
	class:px-2={variant === "normal"}
	class:px-1={variant === "editable"}
	class:py-1={variant === "normal"}
	class:bg-gray-x-x-light={variant === "normal" ||
		(variant === "editable" && !disabled)}
	class:dark:bg-gray-x-x-dark={variant === "normal" ||
		(variant === "editable" && !disabled)}
	class:border-border-light={variant === "normal" ||
		(variant === "editable" && !disabled)}
	class:dark:border-border-dark={variant === "normal" ||
		(variant === "editable" && !disabled)}
	class:bg-transparent={variant === "editable" && disabled}
	class:border-transparent={variant === "editable" && disabled}
	bind:value
	bind:this={ref}
	{disabled}
	{...$$restProps}
/>
