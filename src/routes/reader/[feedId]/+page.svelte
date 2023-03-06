<script lang="ts">
	import { getAppContext } from '$lib/contexts';
	const { sidebarVisible } = getAppContext().stores;

	if ($sidebarVisible === undefined) {
		$sidebarVisible = false;
	}
</script>
