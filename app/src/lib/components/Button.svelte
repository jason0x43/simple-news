<script lang="ts">
	export let variant: "normal" | "invisible" = "normal";
	export let disabled = false;

	let className = "";
	export { className as class };
</script>

<button
	on:click
	type="button"
	{disabled}
	class={`
		flex
		font-light
		items-center
		justify-center
		rounded-sm
		text-black
		dark:text-white
		border-black/10
		dark:border-white/10
		${className}
	`}
	class:border={variant !== "invisible"}
	class:bg-gray-x-light={variant !== "invisible"}
	class:dark:bg-gray-x-dark={variant !== "invisible"}
	class:px-2={variant !== "invisible"}
	class:py-1={variant !== "invisible"}
	{...$$restProps}
>
	<slot />
</button>
