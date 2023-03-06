<script lang="ts">
	import { getAppContext } from '$lib/contexts';
	const { feedId, sidebarVisible } = getAppContext().stores;

	$feedId = undefined;

	if ($sidebarVisible === undefined) {
		$sidebarVisible = true;
	}
</script>
