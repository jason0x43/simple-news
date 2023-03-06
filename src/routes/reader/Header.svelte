<script lang="ts">
	import UserIcon from '$lib/icons/User.svelte';
	import RssIcon from '$lib/icons/Rss.svelte';
	import { getAppContext } from '$lib/contexts';
	import Button from '$lib/components/Button.svelte';

	export let onTitlePress: () => void;

	const { feedName, sidebarVisible } = getAppContext().stores;

	function toggleSidebar() {
		$sidebarVisible = !$sidebarVisible;
	}
</script>

<header class="header">
	<div class="left">
		<Button
			variant="invisible"
			on:click={(event) => {
				toggleSidebar();
				event.stopPropagation();
			}}
		>
			<RssIcon size={22} />
		</Button>
	</div>
	<div class="center">
		<Button variant="invisible" on:click={onTitlePress}>
			<h2>{$feedName ?? ''}</h2>
		</Button>
	</div>
	<div class="right">
		<form method="post" action="/?/logout">
			<Button variant="invisible" type="submit">
				<UserIcon size={20} />
			</Button>
		</form>
	</div>
</header>

<style>
	.header {
		display: grid;
		grid-template-columns: min-content 1fr min-content;
		align-items: center;
		border-bottom: solid 1px var(--border);
		user-select: none;
		-webkit-user-select: none;
	}

	.left {
		display: flex;
		align-items: center;
		padding: calc(var(--side-pad) / 2) var(--side-pad);
		gap: 0.25rem;
	}

	.center {
		justify-content: center;
		display: flex;
		flex-direction: row;
		overflow: hidden;
		gap: 0.5rem;
	}

	.center h2 {
		font-size: var(--font-size);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin: 0;
		cursor: pointer;
	}

	.right {
		justify-self: right;
		padding: calc(var(--side-pad) / 2) var(--side-pad);
	}
</style>
