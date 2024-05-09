<script lang="ts">
	import Button from "./Button.svelte";
	import RssIcon from "../icons/Rss.svelte";
	import UserIcon from "../icons/User.svelte";
	import { goto } from "$app/navigation";
	import { cls } from "$lib/cls";

	export let articleId: string | undefined;
	export let feedId: string | undefined;

	let className = "";
	export { className as class };

	async function handleLogout() {
		goto("/logout");
	}
</script>

<header
	class={cls`
		flex
		items-center
		justify-between
		bg-gray-dark
		dark:bg-gray-dark
		${className}
	`}
>
	<Button
		class="p-2"
		variant="invisible"
		on:click={() => {
			if (articleId) {
				goto(`/feed/${feedId}`);
			} else if (feedId) {
				goto(`/`);
			}
		}}
	>
		<RssIcon size={22} />
	</Button>
	<Button
		class="p-2 text-white dark:text-black"
		variant="invisible"
		on:click={handleLogout}
	>
		<UserIcon size={20} />
	</Button>
</header>
