<script lang="ts">
	import Button from "./Button.svelte";
	import RssIcon from "../icons/Rss.svelte";
	import UserIcon from "../icons/User.svelte";
	import BackIcon from "../icons/Back.svelte";
	import { goto } from "$app/navigation";
	import { getAppContext } from "$lib/context";

	let {
		articleId,
		feedId,
		class: className = "",
	}: {
		articleId: string | undefined;
		feedId: string | undefined;
		class?: string;
	} = $props();

	const managingFeeds = getAppContext("managingFeeds");

	async function handleLogout() {
		goto("/logout");
	}
</script>

<header
	class="
		flex
		h-full
		w-full
		items-center
		justify-between
		bg-hover-light
		dark:bg-hover-dark
		{className}
	"
>
	<div>
		{#if articleId || feedId}
			<Button
				class="p-2"
				variant="invisible"
				onclick={() => {
					if (articleId) {
						goto(`/feed/${feedId}`);
					} else if (feedId) {
						goto(`/`);
					}
				}}
			>
				<BackIcon size={22} />
			</Button>
		{/if}
	</div>
	<div class="flex flex-row sm:flex-col">
		<Button
			class="p-2"
			variant="invisible"
			onclick={() => {
				$managingFeeds = true;
			}}
		>
			<RssIcon size={20} />
		</Button>
		<Button class="p-2" variant="invisible" onclick={handleLogout}>
			<UserIcon size={20} />
		</Button>
	</div>
</header>
