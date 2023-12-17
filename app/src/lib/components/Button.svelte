<script lang="ts">
	export let variant: "normal" | "invisible" = "normal";
	export let disabled = false;

	let className = "";
	export { className as class };
</script>

<button
	type="button"
	{disabled}
	class={`
		flex
		font-light
		items-center
		justify-center
		rounded-sm
		border-black/10
		${className}
	`}
	class:cursor-pointer={!disabled}
	class:border={variant !== "invisible"}
	class:bg-gray-x-light={variant !== "invisible"}
	class:px-2={variant !== "invisible"}
	{...$$restProps}
>
	<slot />
</button>
