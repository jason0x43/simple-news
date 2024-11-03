<script lang="ts">
	let {
		size = 30,
	}: {
		size?: number | string;
	} = $props();
</script>

<svg height={size} width={size} viewBox="0 -960 960 960" fill="currentColor">
	<path d="M640-80 240-480l400-400 71 71-329 329 329 329-71 71Z" />
</svg>
