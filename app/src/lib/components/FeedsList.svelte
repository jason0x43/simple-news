<script lang="ts">
	import {
		articleFilter,
		clearUpdatedArticleIds,
		feedGroups,
		feedId,
		feedStats,
		feeds,
		selectedFeedIds,
		selectedGroupId,
		sidebarVisible,
	} from "../state";
	import {
		allFeedsAreSelected,
		getSavedCount,
		someFeedsAreSelected,
	} from "../util";

	let expanded: { [title: string]: boolean } = {};
</script>

<ul class="feeds">
	<li class:group-selected={$feedId === "saved"}>
		<div class="group">
			<span class="saved" />
			<a class="title" href="/reader/saved">Saved</a>
			{#if $feedStats}
				<span class="Feeds-unread">
					{getSavedCount($feedStats)}
				</span>
			{/if}
		</div>
	</li>
	{#each $feedGroups as group (group.name)}
		<li
			class:expanded={expanded[group.name] ||
				(someFeedsAreSelected(group, $selectedFeedIds) &&
					!allFeedsAreSelected(group, $selectedFeedIds))}
			class:group-selected={group.id === $selectedGroupId ||
				allFeedsAreSelected(group, $selectedFeedIds)}
		>
			<div class="group">
				<button
					class="expander"
					on:click={() => {
						expanded = {
							...expanded,
							[group.name]: !expanded[group.name],
						};
					}}
				/>
				<a
					class="title"
					href={`/reader/group-${group.id}`}
					on:click={() => {
						$sidebarVisible = false;
						clearUpdatedArticleIds();
					}}
				>
					{group.name}
				</a>
				{#if $feedStats}
					<div class="unread">
						{group.feed_ids.reduce(
							(unread, id) =>
								unread +
								($articleFilter === "all"
									? $feedStats?.[id]?.total ?? 0
									: ($feedStats?.[id]?.total ?? 0) -
									  ($feedStats?.[id]?.read ?? 0)),
							0
						)}
					</div>
				{/if}
			</div>

			<ul>
				{#each group.feed_ids as id}
					<li class="feed" class:selected={$selectedFeedIds.includes(id)}>
						<a href={`/reader/feed-${id}`} class="title">
							{$feeds.find((f) => f.id === id)?.title}
						</a>
						{#if $feedStats}
							<div class="unread">
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

<style>
	.feeds {
		list-style-type: none;
		padding: 1rem;
		margin: 0;
		--hpad: 0.5rem;
		--vpad: 0.25rem;
		--expander-width: 1rem;
	}

	.selected,
	.group-selected > .group {
		background: var(--hover-matte);
	}

	.group,
	.feed {
		border-radius: var(--border-radius);
	}

	.expanded.group-selected > ul > .selected {
		border-top-left-radius: 0;
		border-top-right-radius: 0;
	}

	.expanded.group-selected > .group {
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
	}

	.expanded.group-selected > ul > .selected:not(:last-child) {
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
	}

	.feeds ul {
		list-style-type: none;
		padding: 0;
	}

	.feed {
		display: flex;
		flex-direction: row;
	}

	.group {
		display: flex;
		align-items: center;
	}

	.group > *,
	.feed > * {
		padding: var(--vpad) var(--hpad);
	}

	.feed {
		/* padding is size of expander + expander padding */
		padding-left: calc(var(--expander-width) + 2 * var(--hpad));
	}

	.saved,
	.expander {
		border: none;
		background: none;
		padding: 0;
		padding-left: 4px;
	}

	.saved::before,
	.expander::before {
		content: "▷";
		display: inline-block;
		text-align: center;
		flex-grow: 0;
		width: var(--expander-width);
	}

	.saved::before {
		content: "⭐";
	}

	.group-selected .expander::before {
		color: var(--highlight);
	}

	.title {
		flex-grow: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	a.title {
		text-decoration: none;
		color: inherit;
	}

	.group,
	.feed {
		cursor: pointer;
	}

	.feeds ul {
		display: none;
	}

	.expanded ul {
		display: initial;
	}

	.expanded .expander::before {
		content: "▽";
	}

	/* @media (hover: hover) { */
	/* 	.group:hover, */
	/* 	.feed:hover { */
	/* 		background: rgba(0, 0, 0, 0.1); */
	/* 	} */
	/* } */
</style>
