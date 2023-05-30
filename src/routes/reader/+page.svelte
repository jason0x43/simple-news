<script lang="ts">
	import { getAppContext } from '$lib/contexts';
	const sidebarVisible = getAppContext('sidebarVisible');

	if ($sidebarVisible === undefined) {
		$sidebarVisible = true;
	}
</script>
