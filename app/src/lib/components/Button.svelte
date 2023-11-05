<script lang="ts">
	export let variant: 'normal' | 'invisible' = 'normal';
</script>

<button
	type="button"
	on:click
	{...$$restProps}
	class="button"
	class:invisible={variant === 'invisible'}
>
	<slot />
</button>

<style>
	.button {
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
	}
	.invisible {
		border: none;
		background: none;
		padding: 0;
	}

	:not(:disabled) {
		cursor: pointer;
	}
</style>
