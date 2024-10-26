<script lang="ts">
	import Button from "./Button.svelte";
	import RssIcon from "../icons/Rss.svelte";
	import UserIcon from "../icons/User.svelte";
	import { goto } from "$app/navigation";

	let {
		articleId,
		feedId,
		class: className = "",
	}: {
		articleId: string | undefined;
		feedId: string | undefined;
		class?: string;
	} = $props();

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
		<RssIcon size={22} />
	</Button>
	<Button class="p-2" variant="invisible" onclick={handleLogout}>
		<UserIcon size={20} />
	</Button>
</header>
