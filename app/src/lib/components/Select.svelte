<script lang="ts">
	export let value: string;
	export let onChange: ((value: string) => void) | undefined = undefined;

	let className = "";
	export { className as class };
</script>

<select
	class={`
		min-w-0
		appearance-none
		rounded-md
		border
		border-black/10
		bg-gray-x-light
		px-2
		py-1
		font-semibold
		text-xs
		text-black
		dark:border-white/10
		dark:bg-gray-x-dark
		dark:text-white
		${className}
	`}
	bind:value
	on:change={(event) => {
		onChange?.(event.currentTarget.value);
	}}
	{...$$restProps}
>
	<slot />
</select>
