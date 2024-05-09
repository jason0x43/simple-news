<script lang="ts">
	import { cls } from "$lib/cls";

	export let variant: "normal" | "invisible" = "normal";
	export let disabled = false;

	let className = "";
	export { className as class };
</script>

<button
	on:click
	type="button"
	{disabled}
	class={cls`
		flex
		items-center
		justify-center
		rounded-md
		border-border-light
		dark:border-border-dark
		font-semibold
		text-xs
		text-black
		dark:border-white/10
		dark:text-white
		${className}
	`}
	class:border={variant !== "invisible"}
	class:bg-hover-light={variant !== "invisible"}
	class:dark:bg-hover-dark={variant !== "invisible"}
	class:px-2={variant !== "invisible"}
	class:py-1={variant !== "invisible"}
	{...$$restProps}
>
	<slot />
</button>
