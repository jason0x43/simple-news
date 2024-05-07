<script lang="ts">
	import Button from "./Button.svelte";
	import RssIcon from "../icons/Rss.svelte";
	import UserIcon from "../icons/User.svelte";
	import { goto } from "$app/navigation";

	export let feedId: string | undefined;

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
			<h4>Title</h4>
		</Button>
	</div>
	<div class="flex h-full items-center justify-end gap-2">
		<Button class="p-2" variant="invisible" on:click={handleLogout}>
			<UserIcon size={20} />
		</Button>
	</div>
</header>
