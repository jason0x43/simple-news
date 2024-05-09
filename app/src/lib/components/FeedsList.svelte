<script lang="ts">
	import { cls } from "$lib/cls";
	import { getAppContext } from "$lib/context";
	import DoubleRight from "$lib/icons/DoubleRight.svelte";
	import Star from "$lib/icons/Star.svelte";
	import type { Feed, FeedGroupWithFeeds, FeedStats } from "$server";
	import {
		allFeedsAreSelected,
		getSavedCount,
		someFeedsAreSelected,
	} from "../util";
	import Button from "./Button.svelte";
	import StatusValue from "./StatusValue.svelte";

	export let articleFilter: "all" | "unread";
	export let feeds: Feed[];
	export let feedId: string | undefined;
	export let feedGroups: FeedGroupWithFeeds[];
	export let feedStats: FeedStats;
	export let selectedFeedIds: string[];
	export let selectedGroupId: string | undefined;

	const updatedArticleIds = getAppContext("updatedArticleIds");

	let expanded: { [title: string]: boolean } = {};

	type Expanded = typeof expanded;

	function isExpanded(expanded: Expanded, group: FeedGroupWithFeeds): boolean {
		return (
			expanded[group.name] ||
			(someFeedsAreSelected(group, selectedFeedIds) &&
				!allFeedsAreSelected(group, selectedFeedIds))
		);
	}

	function toggleExpanded(
		expanded: Expanded,
		group: FeedGroupWithFeeds,
	): Expanded {
		const isExpanded = expanded[group.name];
		const newExpanded: Expanded = {};
		for (const groupName in expanded) {
			newExpanded[groupName] = false;
		}
		newExpanded[group.name] = !isExpanded;
		return newExpanded;
	}
</script>

<ul class="text-dark-gray dark:text-gray">
	<!-- saved group -->
	<li
		class="flex flex-row items-center px-2"
		class:selected={feedId === "saved"}
		class:not-selected={feedId !== "saved"}
	>
		<div class="flex flex-row items-center justify-start pr-2">
			<Star size="14px" />
		</div>
		<a class="flex-auto truncate py-1" href="/feed/saved">Saved</a>
		{#if feedStats}
			<StatusValue value={getSavedCount(feedStats)} />
		{/if}
	</li>

	<!-- feed groups -->
	{#each feedGroups as group (group.name)}
		<li
			class:text-black={group.id === selectedGroupId}
			class:dark:text-white={group.id === selectedGroupId}
		>
			<div
				class="flex flex-row items-center px-2"
				class:selected={group.id === selectedGroupId}
				class:not-selected={group.id !== selectedGroupId}
			>
				<Button
					variant="invisible"
					class="flex flex-row !justify-start pl-[1px] pr-2"
					on:click={() => {
						expanded = toggleExpanded(expanded, group);
					}}
				>
					<div
						class="transition-all"
						class:rotate-90={isExpanded(expanded, group)}
					>
						<DoubleRight size="14px" />
					</div>
				</Button>
				<a
					class="flex-auto truncate py-1"
					href={`/feed/group-${group.id}`}
					on:click={() => {
						$updatedArticleIds = new Set();
					}}
				>
					{group.name}
				</a>
				{#if feedStats}
					<StatusValue
						value={group.feed_ids.reduce(
							(unread, id) =>
								unread +
								(articleFilter === "all"
									? feedStats?.[id]?.total ?? 0
									: (feedStats?.[id]?.total ?? 0) -
										(feedStats?.[id]?.read ?? 0)),
							0,
						)}
					/>
				{/if}
			</div>

			<!-- feeds -->
			<ul class:hidden={!isExpanded(expanded, group)}>
				{#each group.feed_ids as id}
					<li
						class={`
							my
							flex
							flex-row
							items-center
							rounded-sm
							pl-9
							pr-2
						`}
						class:selected={selectedFeedIds.includes(id)}
						class:not-selected={!selectedFeedIds.includes(id)}
					>
						<a href={`/feed/feed-${id}`} class="flex-auto py-1">
							{feeds.find((f) => f.id === id)?.title}
						</a>
						{#if feedStats}
							<StatusValue
								value={articleFilter === "all"
									? feedStats[id]?.total ?? 0
									: (feedStats[id]?.total ?? 0) - (feedStats[id]?.read ?? 0)}
							/>
						{/if}
					</li>
				{/each}
			</ul>
		</li>
	{/each}
</ul>

<style lang="postcss">
	.selected {
		@apply bg-gradient-to-l
				from-gray-x-light
				to-gray
				text-black
				dark:from-gray-x-x-dark
				dark:to-gray-dark
				dark:text-white;
	}

	.not-selected {
		@apply hover:bg-gray-x-light/60 dark:hover:bg-gray-x-dark/60;
	}
</style>
