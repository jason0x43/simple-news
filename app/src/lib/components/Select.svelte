<script lang="ts">
	export let value: string;

	let className = "";
	export { className as class };
</script>

<select
	class={`
		min-w-0
		appearance-none
		rounded-sm
		border
		border-black/10
		bg-gray-x-light
		px-2
		py-1
		font-normal
		text-black
		dark:border-white/10
		dark:bg-gray-x-dark
		dark:text-white
		${className}
	`}
	bind:value
	on:change
	{...$$restProps}
>
	<slot />
</select>
