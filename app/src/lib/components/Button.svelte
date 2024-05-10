<script lang="ts">
	import { cls } from "$lib/cls";

	export let variant: "normal" | "invisible" = "normal";
	export let disabled = false;
	export let type: "button" | "submit" = "button";

	let className = "";
	export { className as class };
</script>

<button
	on:click
	{type}
	{disabled}
	class={cls`
		flex
		items-center
		justify-center
		rounded-md
		text-xs
		font-semibold
		dark:text-white
		${className}
	`}
	class:text-black={!disabled}
	class:text-gray-400={disabled}
	class:border={variant === "normal"}
	class:bg-hover-light={variant === "normal"}
	class:dark:bg-hover-dark={variant === "normal"}
	class:border-border-light={variant === "normal"}
	class:dark:border-border-dark={variant === "normal"}
	class:px-2={variant === "normal"}
	class:py-1={variant === "normal"}
	{...$$restProps}
>
	<slot />
</button>
