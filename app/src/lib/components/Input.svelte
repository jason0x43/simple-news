<script lang="ts">
	export let value: string;

	let className = "";
	export { className as class };
</script>

<input
	class={`
		appearance-none
		bg-gray-x-light
		dark:bg-gray-x-dark
		border
		border-black/10
		dark:border-white/10
		text-foreground
		font-normal
		py-1
		px-2
		rounded-sm
		${className}
	`}
	bind:value
	{...$$restProps}
/>
