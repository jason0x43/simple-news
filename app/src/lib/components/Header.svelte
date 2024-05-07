<script lang="ts">
	import Button from "./Button.svelte";
	import RssIcon from "../icons/Rss.svelte";
	import UserIcon from "../icons/User.svelte";
	import { goto } from "$app/navigation";
	import type { Feed, FeedGroup } from "$server";

	export let feedId: string | undefined;
	export let feeds: Feed[];
	export let feedGroups: FeedGroup[];

	let title = "Simple News";

	$: {
		if (feedId && feedId !== "saved") {
			const [type, id] = feedId.split("-");

			if (type === "group") {
				const group = feedGroups.find((g) => g.id === id);
				title = group?.name ?? "Simple News";
			} else {
				const feed = feeds.find((f) => f.id === id);
				title = feed?.title ?? "Simple News";
			}
		}
	}

	async function handleLogout() {
		goto("/logout");
	}
</script>

<header
	class={`
		grid
		grid-cols-3
		items-center
		border-b
		border-b-black/10
		bg-gray-x-light
		dark:bg-gray-x-x-dark
		dark:text-white
	`}
>
	<div class="flex h-full items-center justify-start gap-2">
		<Button
			class="block p-2"
			variant="invisible"
			on:click={() => {
				if (feedId) {
					goto(`/feed/${feedId}`);
				}
			}}
		>
			<RssIcon size={22} />
		</Button>
	</div>
	<div class="flex h-full items-center justify-center gap-2">
		<Button variant="invisible">
			<h4>{title}</h4>
		</Button>
	</div>
	<div class="flex h-full items-center justify-end gap-2">
		<Button class="p-2" variant="invisible" on:click={handleLogout}>
			<UserIcon size={20} />
		</Button>
	</div>
</header>
