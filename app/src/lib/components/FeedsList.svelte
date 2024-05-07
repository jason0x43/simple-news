<script lang="ts">
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

<ul class="text-black dark:text-white">
	<!-- saved group -->
	<li
		class={`
			flex
			flex-row
			items-center
			px-2
			hover:bg-gray-x-light/70
			dark:hover:bg-gray-x-dark/70
		`}
		class:font-bold={feedId === "saved"}
	>
		<div class="flex flex-row items-center justify-start pr-2">
			<Star size="1rem" />
		</div>
		<a class="flex-auto truncate py-1" href="/feed/saved">Saved</a>
		{#if feedStats}
			<span>{getSavedCount(feedStats)}</span>
		{/if}
	</li>

	<!-- feed groups -->
	{#each feedGroups as group (group.name)}
		<li class:font-bold={group.id === selectedGroupId}>
			<div
				class={`
					flex
					flex-row
					items-center
					px-2
					hover:bg-gray-x-light/70
					dark:hover:bg-gray-x-dark/70
				`}
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
						<DoubleRight size="1rem" />
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
					<div>
						{group.feed_ids.reduce(
							(unread, id) =>
								unread +
								(articleFilter === "all"
									? feedStats?.[id]?.total ?? 0
									: (feedStats?.[id]?.total ?? 0) -
										(feedStats?.[id]?.read ?? 0)),
							0,
						)}
					</div>
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
							hover:bg-gray-x-light/70
							dark:hover:bg-gray-x-dark/70
						`}
						class:font-bold={selectedFeedIds.includes(id)}
					>
						<a href={`/feed/feed-${id}`} class="flex-auto py-1">
							{feeds.find((f) => f.id === id)?.title}
						</a>
						{#if feedStats}
							<div>
								{articleFilter === "all"
									? feedStats[id]?.total ?? 0
									: (feedStats[id]?.total ?? 0) - (feedStats[id]?.read ?? 0)}
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		</li>
	{/each}
</ul>
