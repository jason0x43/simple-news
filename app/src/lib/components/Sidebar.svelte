<script lang="ts">
	import { articleFilter, managingFeeds } from "../state";
	import { slide } from "../transition";
	import Button from "./Button.svelte";
	import FeedsList from "./FeedsList.svelte";
	import Select from "./Select.svelte";
</script>

<div
	class={`bg-white
		text-highlight
		h-full
		w-full
		md:w-80
		flex
		flex-col
		absolute
		top-0
		left-0
		z-30
		border-r-black/10
		border-r-[1px]`}
	in:slide={{ direction: "right", duration: 250 }}
	out:slide={{ direction: "right", duration: 250 }}
>
	<div class="flex-1 overflow-auto">
		<FeedsList />
	</div>
	<div
		class={`
			flex-grow-0
			flex-shrink-0
			flex
			justify-stretch
			md:justify-center
			m-2
			gap-2
			border-1`}
	>
		<Button class="flex-auto" on:click={() => ($managingFeeds = true)}
			>Manage Feeds</Button
		>
		<Select class="flex-auto" bind:value={$articleFilter}>
			<option value="unread">Unread</option>
			<option value="all">All</option>
		</Select>
	</div>
</div>
