<script lang="ts">
	export let value: string;
	export let onChange: ((value: string) => void) | undefined = undefined;

	let className = "";
	export { className as class };
</script>

<select
	class={`
		border-border-light
		dark:border-border-dark
		min-w-0
		appearance-none
		rounded-md
		border
		bg-hover-light
		px-2
		py-1
		text-xs
		font-semibold
		text-black
		dark:bg-hover-dark
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
