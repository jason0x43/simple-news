<script lang="ts">
	let {
		value,
	}: {
		value: number | string;
	} = $props();
</script>

<span class="text-disabled text-xs dark:text-disabled-dark">{value}</span>
