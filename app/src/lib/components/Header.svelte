<script lang="ts">
	import Button from "./Button.svelte";
	import RssIcon from "../icons/Rss.svelte";
	import UserIcon from "../icons/User.svelte";
	import { title, logout } from "../state";
	import { goto, path } from "../router";

	async function handleLogout() {
		await logout();
		window.location.href = "/login";
	}

	function goBack() {
		const newPath = $path.split("/").slice(0, -1).join("/");
		goto(new URL(newPath, window.location.href));
	}
</script>

<header
	class={`
		bg-gray-x-light
		dark:bg-gray-x-dark
		dark:text-white
		grid
		grid-cols-3
		items-center
		border-b
		border-b-black/10
	`}
>
	<div class="flex h-full justify-start items-center gap-2">
		<Button class="block p-2" variant="invisible" on:click={goBack}>
			<RssIcon size={22} />
		</Button>
	</div>
	<div class="flex h-full justify-center items-center gap-2">
		<Button variant="invisible">
			<h4>{$title}</h4>
		</Button>
	</div>
	<div class="flex h-full justify-end items-center gap-2">
		<Button class="p-2" variant="invisible" on:click={handleLogout}>
			<UserIcon size={20} />
		</Button>
	</div>
</header>
