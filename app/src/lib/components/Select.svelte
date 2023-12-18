<script lang="ts">
	export let value: string;

	let className = "";
	export { className as class };
</script>

<select
	class={`
		appearance-none
		bg-gray-x-light
		dark:bg-gray-x-dark
		border
		border-black/10
		dark:border-white/10
		text-black
		dark:text-white
		font-normal
		py-1
		px-2
		rounded-sm
		min-w-0
		${className}
	`}
	bind:value
	on:change
	{...$$restProps}
>
	<slot />
</select>
