<script lang="ts">
	import Button from "./Button.svelte";
	import RssIcon from "../icons/Rss.svelte";
	import UserIcon from "../icons/User.svelte";
	import { feedId, feeds, feedGroups, sidebarVisible } from "../state";

	let title = "";

	$: {
		if ($feedId) {
			if ($feedId === "saved") {
				title = "Saved";
			} else {
				const [type, id] = $feedId.split("-");
				if (type === "group") {
					const group = $feedGroups?.find((group) => group.id === id);
					title = group?.name ?? "";
				} else {
					const feed = $feeds?.find((feed) => feed.id === id);
					title = feed?.title ?? "";
				}
			}
		}
	}
</script>

<header class="header">
	<div class="left">
		<Button
			variant="invisible"
			on:click={(event) => {
				event.stopPropagation();
				$sidebarVisible = !$sidebarVisible;
			}}
		>
			<RssIcon size={22} />
		</Button>
	</div>
	<div class="center">
		<Button variant="invisible">
			<h2>{title}</h2>
		</Button>
	</div>
	<div class="right">
		<a href="/login" class="button" data-native-router>
			<UserIcon size={20} />
		</a>
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

	.button {
		display: flex;
		color: var(--foreground);
	}
</style>
