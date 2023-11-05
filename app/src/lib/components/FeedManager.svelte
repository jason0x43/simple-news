<script lang="ts">
	import Button from "./Button.svelte";
	import Dialog from "./Dialog.svelte";
	import Portal from "./Portal.svelte";
	import Select from "./Select.svelte";
	import { showToast } from "../toast";
	import { getEventValue } from "../util";
	import {
		addFeed,
		addFeedGroup,
		addFeedToGroup,
		feedGroups,
		feeds,
		managingFeeds,
		updateFeed,
	} from "../state";
	import type { Feed, FeedGroup } from "server";

	let busy = false;
	let addFeedUrl = "";
	let addGroupName = "";
	let updateFeedUrl = "";
	let updateFeedId = "";
	let newGroupName = "";
	let renameFeedGroupId = $feedGroups[0]?.id ?? "";

	async function busyOp(
		callback: () => Promise<unknown>,
		success: string,
		failure: string
	) {
		busy = true;
		let err: unknown | undefined;

		try {
			await callback();
		} catch (error) {
			err = error;
			console.warn(error);
		}

		setTimeout(() => {
			busy = false;
			if (err) {
				showToast(failure, { type: "bad", duration: 2000 });
			} else {
				showToast(success, { type: "good", duration: 2000 });
			}
		}, 500);
	}

	// Move a feed to a new group
	async function handleMoveFeed({
		feedId,
		groupId,
	}: {
		feedId: string;
		groupId: string;
	}) {
		busyOp(
			() => addFeedToGroup({ feedId, groupId }),
			"Unable to add feed",
			"Feed added"
		);
	}

	// Add a new feed
	async function handleAddFeed() {
		busyOp(() => addFeed(addFeedUrl), "Unable to add feed", "Feed added");
	}

	// Update an existing feed
	async function handleUpdateFeed() {
		if (!updateFeedId || !updateFeedUrl) {
			return;
		}

		const id = updateFeedId;
		busyOp(
			() => updateFeed(id, { url: updateFeedUrl }),
			"Unable to update feed",
			"Feed updated"
		);
	}

	// Add a new group
	async function handleAddGroup() {
		if (!addGroupName) {
			return;
		}

		busyOp(
			() => addFeedGroup({ name: addGroupName }),
			"Unable to add group",
			"Group added"
		);
	}

	// Rename an existing group
	async function handleRenameGroup() {}

	$: groups = $feedGroups.reduce((acc, group) => {
		for (const feed of group.feeds) {
			acc[feed.id] = group.id;
		}
		return acc;
	}, {} as Record<Feed["id"], FeedGroup["id"]>);

	$: sortedFeeds = $feeds.sort((a, b) => {
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
											value={groups[feed.id] ?? "not subscribed"}
											on:change={(event) => {
												const value = getEventValue(event);
												if (value) {
													handleMoveFeed({ feedId: feed.id, groupId: value });
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
					<form on:submit|preventDefault={handleAddFeed}>
						<input bind:value={addFeedUrl} placeholder="https://..." />
						<Button type="submit">Save</Button>
					</form>

					<h3>Update Feed URL</h3>
					<form on:submit|preventDefault={handleUpdateFeed}>
						<div class="feed-select">
							<Select
								value={updateFeedId}
								on:change={(event) => {
									updateFeedId = getEventValue(event) ?? "";
									const feed = $feeds.find(({ id }) => id === updateFeedId);
									updateFeedUrl = feed?.url ?? "";
								}}
							>
								{#each $feeds as feed (feed.id)}
									<option value={feed.id}>{feed.title}</option>
								{/each}
							</Select>
						</div>
						<input
							value={updateFeedUrl}
							on:change={(event) => {
								updateFeedUrl = getEventValue(event) ?? "";
							}}
							placeholder="https://..."
						/>
						<Button type="submit">Save</Button>
					</form>

					<h3>Add Group</h3>
					<form on:submit|preventDefault={handleAddGroup}>
						<input bind:value={addGroupName} placeholder="Applications" />
						<Button type="submit">Save</Button>
					</form>

					<h3>Rename Group</h3>
					<form on:submit|preventDefault={handleRenameGroup}>
						<Select bind:value={renameFeedGroupId}>
							{#each $feedGroups as group (group.id)}
								<option value={group.id}>{group.name}</option>
							{/each}
						</Select>
						<input bind:value={newGroupName} placeholder="Applications" />
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
