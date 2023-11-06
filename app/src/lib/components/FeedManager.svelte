<script lang="ts">
	import Button from "./Button.svelte";
	import Dialog from "./Dialog.svelte";
	import Portal from "./Portal.svelte";
	import Select from "./Select.svelte";
	import { showToast } from "../toast";
	import { getEventValue, seconds } from "../util";
	import {
		addFeed,
		addFeedGroup,
		feedGroups,
		feeds,
		managingFeeds,
		moveFeedToGroup,
		refreshFeed,
		updateFeed,
	} from "../state";
	import type { FeedGroupId, FeedId } from "server";
	import Refresh from "../icons/Refresh.svelte";

	let busy = false;
	let addFeedData = { url: "" };
	let addGroupData = { name: "" };
	let updateFeedUrlData = { feedId: "", url: "" };
	let updateFeedTitleData = { feedId: "", title: "" };
	let renameGroupData = {
		feedGroupId: $feedGroups[0]?.id ?? "",
		name: "",
	};

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
		}, seconds(0.5));
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
			() => moveFeedToGroup({ feedId, groupId }),
			"Unable to add feed",
			"Feed added"
		);
	}

	// Add a new feed
	async function handleAddFeed() {
		busyOp(() => addFeed(addFeedData.url), "Unable to add feed", "Feed added");
	}

	// Update an existing feed
	async function handleUpdateFeedUrl() {
		if (!updateFeedUrlData.feedId || !updateFeedUrlData.url) {
			return;
		}

		const id = updateFeedUrlData.feedId;
		busyOp(
			() => updateFeed(id, { url: updateFeedUrlData.url }),
			"Unable to update feed",
			"Feed updated"
		);
	}

	// Update an existing feed
	async function handleUpdateFeedTitle() {
		if (!updateFeedTitleData.feedId || !updateFeedTitleData.title) {
			return;
		}

		const id = updateFeedTitleData.feedId;
		busyOp(
			() => updateFeed(id, { title: updateFeedTitleData.title }),
			"Unable to update feed title",
			"Feed title updated"
		);
	}

	// Add a new group
	async function handleAddGroup() {
		if (!addGroupData.name) {
			return;
		}

		busyOp(
			() => addFeedGroup({ name: addGroupData.name }),
			"Unable to add group",
			"Group added"
		);
	}

	// Rename an existing group
	async function handleRenameGroup() {}

	// Refresh a feed
	async function handleRefreshFeed(feedId: FeedId) {
		busyOp(
			() => refreshFeed(feedId),
			"There was a problem refreshing the feed",
			"Feed refreshed!"
		);
	}

	$: groups = $feedGroups.reduce((acc, group) => {
		for (const id of group.feed_ids) {
			acc[id] = group.id;
		}
		return acc;
	}, {} as Record<FeedId, FeedGroupId>);

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
											fill
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

										<Button
											on:click={() => {
												handleRefreshFeed(feed.id);
											}}
										>
											<Refresh size="1em" />
										</Button>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</section>

				<section>
					<h3>Add Feed</h3>
					<form on:submit|preventDefault={handleAddFeed}>
						<input bind:value={addFeedData.url} placeholder="https://..." />
						<Button type="submit">Save</Button>
					</form>

					<h3>Update Feed URL</h3>
					<form on:submit|preventDefault={handleUpdateFeedUrl}>
						<div class="feed-select">
							<Select
								value={updateFeedUrlData.feedId}
								on:change={(event) => {
									updateFeedUrlData.feedId = getEventValue(event) ?? "";
									const feed = $feeds.find(
										({ id }) => id === updateFeedUrlData.feedId
									);
									updateFeedUrlData.url = feed?.url ?? "";
								}}
							>
								{#each $feeds as feed (feed.id)}
									<option value={feed.id}>{feed.title}</option>
								{/each}
							</Select>
						</div>
						<input
							value={updateFeedUrlData.url}
							on:change={(event) => {
								updateFeedUrlData.url = getEventValue(event) ?? "";
							}}
							placeholder="https://..."
						/>
						<Button type="submit">Save</Button>
					</form>

					<h3>Update Feed Title</h3>
					<form on:submit|preventDefault={handleUpdateFeedTitle}>
						<div class="feed-select">
							<Select
								value={updateFeedTitleData.feedId}
								on:change={(event) => {
									updateFeedTitleData.feedId = getEventValue(event) ?? "";
									const feed = $feeds.find(
										({ id }) => id === updateFeedTitleData.feedId
									);
									updateFeedTitleData.title = feed?.title ?? "";
								}}
							>
								{#each $feeds as feed (feed.id)}
									<option value={feed.id}>{feed.title}</option>
								{/each}
							</Select>
						</div>
						<input
							value={updateFeedTitleData.title}
							on:change={(event) => {
								updateFeedTitleData.title = getEventValue(event) ?? "";
							}}
							placeholder="https://..."
						/>
						<Button type="submit">Save</Button>
					</form>

					<h3>Add Group</h3>
					<form on:submit|preventDefault={handleAddGroup}>
						<input bind:value={addGroupData.name} placeholder="Applications" />
						<Button type="submit">Save</Button>
					</form>

					<h3>Rename Group</h3>
					<form on:submit|preventDefault={handleRenameGroup}>
						<Select bind:value={renameGroupData.feedGroupId}>
							{#each $feedGroups as group (group.id)}
								<option value={group.id}>{group.name}</option>
							{/each}
						</Select>
						<input bind:value={addGroupData.name} placeholder="Applications" />
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
		overflow-y: auto;
		overflow-x: hidden;
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
		flex: 1;
		/* with overflow enabled, a fraction of the right pixel is being cut off */
		padding-right: 1px;
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
		flex: 1;
		display: flex;
		flex-direction: row;
		align-items: stretch;
		gap: var(--gap);
		/* /1* Mysteriously needed to keep right control border from being trimmed *1/ */
		/* padding-right: 1px; */
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
