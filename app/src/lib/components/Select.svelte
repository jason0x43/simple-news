<script lang="ts">
	export let value: string;
	export let variant: "normal" | "invisible" | "editable" = "normal";
	export let disabled = false;
	export let onChange: ((value: string) => void) | undefined = undefined;

	let className = "";
	export { className as class };
</script>

<select
	class={`
		text-foreground
		min-w-0
		appearance-none
		rounded-md
		border
		dark:text-white
		${className}
	`}
	class:px-2={variant === "normal"}
	class:px-1={variant === "editable"}
	class:py-1={variant === "normal"}
	class:font-semibold={variant === "normal"}
	class:text-xs={variant === "normal"}
	class:bg-gray-x-x-light={variant === "normal" ||
		(variant === "editable" && !disabled)}
	class:dark:bg-gray-x-x-dark={variant === "normal" ||
		(variant === "editable" && !disabled)}
	class:border-border-light={variant === "normal" ||
		(variant === "editable" && !disabled)}
	class:dark:border-border-dark={variant === "normal" ||
		(variant === "editable" && !disabled)}
	class:border-transparent={variant === "editable" && disabled}
	class:bg-transparent={variant === "editable" && disabled}
	bind:value
	on:change={(event) => {
		onChange?.(event.currentTarget.value);
	}}
	{disabled}
	{...$$restProps}
>
	<slot />
</select>
