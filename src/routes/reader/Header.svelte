<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/Button.svelte';
	import RssIcon from '$lib/icons/Rss.svelte';
	import UserIcon from '$lib/icons/User.svelte';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';

	export let onTitlePress: () => void;

	const sidebarVisible = getContext<Writable<boolean>>('sidebarVisible');

	let title = '';

	$: {
		if ($page.data.feedId) {
			if ($page.data.feedId === 'saved') {
				title = 'Saved';
			} else {
				const [type, id] = $page.data.feedId.split('-');
				if (type === 'group') {
					const group = $page.data.feedGroups?.find((group) => group.id === id);
					title = group?.name ?? '';
				} else {
					const feed = $page.data.feeds?.find((feed) => feed.id === id);
					title = feed?.title ?? '';
				}
			}
		}
	}

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
			<h2>{title}</h2>
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
