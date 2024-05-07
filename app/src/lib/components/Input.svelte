<script lang="ts">
	export let value: string;

	let className = "";
	export { className as class };
</script>

<input
	class={`
		text-foreground
		appearance-none
		rounded-sm
		border
		border-black/10
		bg-gray-x-light
		px-2
		py-1
		font-normal
		dark:border-white/10
		dark:bg-gray-x-dark
		${className}
	`}
	bind:value
	{...$$restProps}
/>
