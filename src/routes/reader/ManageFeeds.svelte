<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import Portal from '$lib/components/Portal.svelte';
	import Select from '$lib/components/Select.svelte';
	import { showToast } from '$lib/toast';
	import { getEventValue } from '$lib/util';
	import { getAppContext } from '$lib/contexts';
	import type { Feed } from '$lib/db/feed';
	import type { FeedGroup } from '$lib/db/feedgroup';
	import {
		get as getFeeds,
		post as postFeed,
		put as putFeed
	} from '../api/feeds';
	import { put as putFeedGroup } from '../api/feedgroups';

	const { feedGroups, feedStats, managingFeeds } = getAppContext().stores;

	let feeds: Feed[] = [];

	onMount(() => {
		getFeeds()
			.then((allFeeds) => {
				feeds = allFeeds;
			})
			.catch((error) => {
				console.warn(`Error getting feeds: ${error}`);
			});
	});

	/** A mapping of feed IDs to their containing group IDs */
	let groups: { [feedId: string]: string } = {};

	$: {
		if ($feedGroups) {
			groups = {};
			for (const group of $feedGroups) {
				for (const feed of group.feeds) {
					groups[feed.id] = group.id;
				}
			}
		}
	}

	let busy = false;
	let addFeedUrl = '';

	$: updateFeedId = feeds[0]?.id;
	$: updateFeedUrl = feeds[0]?.url;

	async function addFeed() {
		busy = true;
		let err: unknown | undefined;

		try {
			const newFeed = await postFeed(addFeedUrl);
			feeds = [...feeds, newFeed];
			addFeedUrl = '';
		} catch (error) {
			err = error;
			console.warn(error);
		}

		setTimeout(() => {
			busy = false;
			if (err) {
				showToast('Unable to add feed', { type: 'bad', duration: 2000 });
			} else {
				showToast('Feed added', { type: 'good', duration: 2000 });
			}
		}, 500);
	}

	async function updateFeed() {
		if (!updateFeedId || !updateFeedUrl) {
			return;
		}

		busy = true;
		let err: unknown | undefined;

		try {
			const feed = {
				id: updateFeedId,
				url: updateFeedUrl
			};
			const updatedFeed = await putFeed(feed);
			const index = feeds.findIndex(({ id }) => id === feed.id);
			if (index) {
				feeds[index] = updatedFeed;
			}
			addFeedUrl = '';
		} catch (error) {
			err = error;
			console.warn(error);
		}

		setTimeout(() => {
			busy = false;
			if (err) {
				showToast('Unable to add feed', { type: 'bad', duration: 2000 });
			} else {
				showToast('Feed updated', { type: 'good', duration: 2000 });
			}
		}, 500);
	}

	async function updateGroup({
		feedId,
		groupId
	}: {
		feedId: Feed['id'];
		groupId: FeedGroup['id'];
	}): Promise<void> {
		busy = true;
		let err: unknown | undefined;

		try {
			const updates = await putFeedGroup({
				feedId,
				groupId
			});
			$feedStats = updates.feedStats;
			$feedGroups = updates.feedGroups;
		} catch (error) {
			err = error;
			console.warn(error);
		}

		setTimeout(() => {
			busy = false;
			if (err) {
				showToast('Unable to update feed', { type: 'bad', duration: 2000 });
			} else {
				showToast('Feed updated', { type: 'good', duration: 2000 });
			}
		}, 500);
	}

	$: sortedFeeds = feeds.sort((a, b) => {
		if (a.title.toLowerCase() === b.title.toLowerCase()) {
			return 0;
		}
		if (a.title.toLowerCase() > b.title.toLowerCase()) {
			return 1;
		}
		return -1;
	});
</script>

<Portal anchor="modal">
	<Dialog
		title="Manage Feeds"
		onClose={() => {
			$managingFeeds = false;
		}}
		{busy}
	>
		<div class="manage-feeds">
			<div class="scroller">
				<section>
					<h3>Feeds</h3>
					<div class="list-wrapper">
						<div class="table">
							{#each sortedFeeds as feed (feed.id)}
								<div class="feed">
									<span class="feed-title">{feed.title}</span>
									<span class="feed-url">{feed.url}</span>
									<div class="controls">
										<Select
											value={groups[feed.id] ?? 'not subscribed'}
											on:change={(event) => {
												const value = getEventValue(event);
												if (value) {
													updateGroup({ feedId: feed.id, groupId: value });
												}
											}}
										>
											<option value="not subscribed">Not subscribed</option>
											{#each $feedGroups as group (group.id)}
												<option value={group.id}>{group.name}</option>
											{/each}
										</Select>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</section>

				<section>
					<h3>Add Feed</h3>
					<form on:submit|preventDefault={addFeed}>
						<input bind:value={addFeedUrl} placeholder="https://..." />
						<Button type="submit">Save</Button>
					</form>

					<h3>Update Feed URL</h3>
					<form on:submit|preventDefault={updateFeed}>
						<div class="feed-select">
							<Select
								value={updateFeedId}
								on:change={(event) => {
									updateFeedId = getEventValue(event) ?? '';
									const feed = feeds.find(({ id }) => id === updateFeedId);
									updateFeedUrl = feed?.url ?? '';
								}}
							>
								{#each feeds as feed (feed.id)}
									<option value={feed.id}>{feed.title}</option>
								{/each}
							</Select>
						</div>
						<input
							value={updateFeedUrl}
							on:change={(event) => {
								updateFeedUrl = getEventValue(event) ?? '';
							}}
							placeholder="https://..."
						/>
						<Button type="submit">Save</Button>
					</form>

					<h3>Add Group</h3>
					<form>
						<input name="group-name" placeholder="Applications" />
						<Button type="submit">Save</Button>
					</form>

					<h3>Rename Group</h3>
					<form>
						<Select value={$feedGroups[0]?.id}>
							{#each $feedGroups as group (group.id)}
								<option value={group.id}>{group.name}</option>
							{/each}
						</Select>
						<input name="group-name" placeholder="Applications" />
						<Button type="submit">Save</Button>
					</form>
				</section>
			</div>
		</div>
	</Dialog>
</Portal>

<style>
	.manage-feeds {
		display: flex;
	}

	.scroller {
		display: grid;
		grid-template-columns: 1fr 1fr;
		padding: 1em;
		flex-grow: 1;
	}

	section {
		box-sizing: border-box;
		padding: 1em;
		display: flex;
		flex-direction: column;
		gap: 1em;
		overflow: auto;
	}

	section:first-child {
		border-right: solid 1px var(--border);
		padding-right: 2em;
	}

	section:last-child {
		padding-left: 2em;
	}

	h3 {
		margin: 0;
	}

	.list-wrapper {
		overflow: auto;
		display: flex;
	}

	form {
		display: flex;
		gap: var(--gap);
	}

	input {
		flex-grow: 1;
		min-width: 1em;
	}

	.table {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.feed {
		display: flex;
		flex-direction: column;
		border-bottom: solid 1px var(--border);
		padding: 0.5em 0;
		gap: 0.5rem;
	}

	.feed:first-child {
		padding-top: 0;
	}

	.feed:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.feed-title {
		display: block;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.feed-url {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		font-style: italic;
		font-size: 90%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.controls {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
	}

	.feed-select {
		max-width: 30%;
	}

	/* Mobile */
	@media only screen and (max-width: 800px) {
		.manage-feeds {
			display: flex;
			flex-direction: column;
			overflow: auto;
		}

		section:first-child {
			border-right: none;
			padding-right: 1em;
		}

		section:last-child {
			padding-left: 1em;
		}

		.scroller {
			display: flex;
			flex-direction: column;
			flex-grow: 1;
			flex-shrink: 0;
			padding: 1em;
		}
	}
</style>
