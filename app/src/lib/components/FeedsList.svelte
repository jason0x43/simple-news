<script lang="ts">
	import type { FeedGroupWithFeeds } from "server";
	import {
		articleFilter,
		clearUpdatedArticleIds,
		feedGroups,
		feedId,
		feedStats,
		feeds,
		selectedFeedIds,
		selectedGroupId,
	} from "../state";
	import {
		allFeedsAreSelected,
		getSavedCount,
		someFeedsAreSelected,
	} from "../util";
	import Button from "./Button.svelte";

	let expanded: { [title: string]: boolean } = {};

	type Expanded = typeof expanded;

	function isExpanded(expanded: Expanded, group: FeedGroupWithFeeds): boolean {
		return (
			expanded[group.name] ||
			(someFeedsAreSelected(group, $selectedFeedIds) &&
				!allFeedsAreSelected(group, $selectedFeedIds))
		);
	}

	function isGroupSelected(group: FeedGroupWithFeeds): boolean {
		return (
			group.id === $selectedGroupId ||
			allFeedsAreSelected(group, $selectedFeedIds)
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
			py-1
			px-2
			hover:bg-gray-x-light/70
			dark:hover:bg-gray-x-dark/70
		`}
		class:bg-gray-x-light={$feedId === "saved"}
		class:dark:bg-gray-x-dark={$feedId === "saved"}
	>
		<div class="flex flex-row justify-start w-5 pr-2 text-[9px]">⭐</div>
		<a class="flex-auto truncate" href="/reader/saved">Saved</a>
		{#if $feedStats}
			<span>{getSavedCount($feedStats)}</span>
		{/if}
	</li>

	<!-- feed groups -->
	{#each $feedGroups as group (group.name)}
		<li
			class:bg-gray-x-light={isGroupSelected(group)}
			class:dark:bg-gray-x-dark={isGroupSelected(group)}
		>
			<div
				class={`
					flex
					flex-row
					py-1
					px-2
					hover:bg-gray-x-light/70
					dark:hover:bg-gray-x-dark/70
				`}
			>
				<Button
					variant="invisible"
					class="flex flex-row w-5 !justify-start pl-[1px] pr-2"
					on:click={() => {
						expanded = toggleExpanded(expanded, group);
					}}><div class:rotate-90={isExpanded(expanded, group)}>▷</div></Button
				>
				<a
					class="flex-auto truncate"
					href={`/reader/group-${group.id}`}
					on:click={() => {
						clearUpdatedArticleIds();
					}}
				>
					{group.name}
				</a>
				{#if $feedStats}
					<div>
						{group.feed_ids.reduce(
							(unread, id) =>
								unread +
								($articleFilter === "all"
									? $feedStats?.[id]?.total ?? 0
									: ($feedStats?.[id]?.total ?? 0) -
									  ($feedStats?.[id]?.read ?? 0)),
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
							flex
							flex-row
							pl-9
							pr-2
							py-1
							my
							rounded-sm
							hover:bg-gray-x-light/70
							dark:hover:bg-gray-x-dark/70
						`}
						class:bg-gray-x-light={$selectedFeedIds.includes(id)}
						class:dark:bg-gray-x-dark={$selectedFeedIds.includes(id)}
					>
						<a href={`/reader/feed-${id}`} class="flex-auto">
							{$feeds.find((f) => f.id === id)?.title}
						</a>
						{#if $feedStats}
							<div>
								{$articleFilter === "all"
									? $feedStats[id]?.total ?? 0
									: ($feedStats[id]?.total ?? 0) - ($feedStats[id]?.read ?? 0)}
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		</li>
	{/each}
</ul>
