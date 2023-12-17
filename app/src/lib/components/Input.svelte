<script lang="ts">
	export let value: string;

	let className = "";
	export { className as class };
</script>

<input
	class={`
		appearance-none
		bg-gray-x-light
		border
		border-black/10
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
