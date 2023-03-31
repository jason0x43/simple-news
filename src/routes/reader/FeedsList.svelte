<script lang="ts">
	import { page } from '$app/stores';
	import { getAppContext } from '$lib/contexts';
	import type { Feed } from '$lib/db/feed';
	import { allAreIdentified, getArticleCount, getGroupFeeds } from '$lib/feed';

	const { articleFilter, userFeeds, feedGroups, feedStats, selectedFeedIds } =
		getAppContext().stores;

	let expanded: { [title: string]: boolean } = {};

	$: feedId = $page.data.feedId;

	function containsFeed(groupFeeds: Feed[], feedIds: string[]) {
		return feedIds.some((id) => groupFeeds.find((f) => f.id === id));
	}
</script>

<ul class="feeds">
	<li class:group-selected={feedId === 'saved'}>
		<div class="group">
			<span class="saved" />
			<a class="title" href="/reader/saved">Saved</a>
			{#if $feedStats}
				<span class="Feeds-unread">
					{$feedStats.saved}
				</span>
			{/if}
		</div>
	</li>
	{#each $feedGroups as group (group.name)}
		{@const groupFeeds = getGroupFeeds(group, $userFeeds)}
		{#if getArticleCount(groupFeeds, $feedStats, $articleFilter) > 0}
			<li
				class:expanded={expanded[group.name] ||
					(containsFeed(groupFeeds, $selectedFeedIds) &&
						!allAreIdentified(groupFeeds, $selectedFeedIds))}
				class:group-selected={allAreIdentified(groupFeeds, $selectedFeedIds)}
			>
				<div class="group">
					<button
						class="expander"
						on:click={() => {
							expanded = {
								...expanded,
								[group.name]: !expanded[group.name]
							};
						}}
					/>
					<a class="title" href={`/reader/group-${group.id}`}>
						{group.name}
					</a>
					{#if $feedStats}
						<span class="Feeds-unread">
							{getArticleCount(groupFeeds, $feedStats, $articleFilter)}
						</span>
					{/if}
				</div>

				<ul>
					{#each groupFeeds as feed (feed.id)}
						{#if getArticleCount([feed], $feedStats, $articleFilter) > 0}
							<li
								class="feed"
								class:selected={allAreIdentified([feed], $selectedFeedIds)}
							>
								<a href={`/reader/feed-${feed.id}`} class="title">
									{$userFeeds.find((f) => f.id === feed.id)?.title}
								</a>
								<div class="unread">
									{($feedStats.feeds[feed.id].total ?? 0) -
										($feedStats.feeds[feed.id].read ?? 0)}
								</div>
							</li>
						{/if}
					{/each}
				</ul>
			</li>
		{/if}
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
		background: rgba(255, 255, 255, 0.1);
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
		content: '▷';
		display: inline-block;
		text-align: center;
		flex-grow: 0;
		width: var(--expander-width);
	}

	.saved::before {
		content: '⭐';
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
		content: '▽';
	}

	@media (hover: hover) {
		.group:hover,
		.feed:hover {
			background: rgba(0, 0, 0, 0.1);
		}
	}
</style>
