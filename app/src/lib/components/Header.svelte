<script lang="ts">
	import Button from "./Button.svelte";
	import RssIcon from "../icons/Rss.svelte";
	import UserIcon from "../icons/User.svelte";
	import { title, sidebarVisible } from "../state";
</script>

<header
	class={`
		bg-gray-x-light
		grid
		grid-cols-3
		items-center
		border-b
		border-b-black/10
	`}
>
	<div class="flex h-full justify-start items-center px-2 py-1 gap-2">
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
	<div class="flex h-full justify-center items-center px-2 py-1 gap-2">
		<Button variant="invisible">
			<h4>{$title}</h4>
		</Button>
	</div>
	<div class="flex h-full justify-end items-center px-2 py-1 gap-2">
		<a href="/login" class="text-black" data-native-router>
			<UserIcon size={20} />
		</a>
	</div>
</header>
