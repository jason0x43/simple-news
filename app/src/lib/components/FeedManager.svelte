<script lang="ts">
	import Button from "./Button.svelte";
	import Dialog from "./Dialog.svelte";
	import Portal from "./Portal.svelte";
	import Select from "./Select.svelte";
	import Input from "./Input.svelte";
	import { showToast } from "../toast";
	import { getEventValue, seconds } from "../util";
	import type { Feed, FeedGroupId, FeedGroupWithFeeds, FeedId } from "$server";
	import Refresh from "../icons/Refresh.svelte";
	import {
		addFeed,
		addFeedGroup,
		addGroupFeed,
		refreshFeed,
		removeFeedFromAllGroups,
		removeGroupFeed,
		updateFeed,
	} from "$lib/api";

	export let feedGroups: FeedGroupWithFeeds[];
	export let feeds: Feed[];
	export let onClose: () => void;

	let busy = false;
	let addFeedData = { url: "" };
	let addGroupData = { name: "" };
	let updateFeedUrlData = { feedId: "", url: "" };
	let updateFeedTitleData = { feedId: "", title: "" };
	let renameGroupData = {
		feedGroupId: feedGroups[0]?.id ?? "",
		name: "",
	};

	async function busyOp(
		callback: () => Promise<unknown>,
		success: string,
		failure: string,
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
			() => addGroupFeed(groupId, { feed_id: feedId, move_feed: true }),
			"Unable to move feed",
			"Feed added",
		);
	}

	// Remove a feed from all groups
	async function handleRemoveFeed(feedId: string) {
		busyOp(
			() => removeFeedFromAllGroups(feedId),
			"Unable to unsubscribe from feed",
			"Unsubscribed from feed",
		);
	}

	// Add a new feed
	async function handleAddFeed() {
		busyOp(() => addFeed(addFeedData), "Unable to add feed", "Feed added");
	}

	// Update an existing feed
	async function handleUpdateFeedUrl() {
		if (!updateFeedUrlData.feedId || !updateFeedUrlData.url) {
			return;
		}

		const id = updateFeedUrlData.feedId;
		busyOp(
			() => updateFeed(id, updateFeedUrlData),
			"Unable to update feed",
			"Feed updated",
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
			"Feed title updated",
		);
	}

	// Add a new group
	async function handleAddGroup() {
		if (!addGroupData.name) {
			return;
		}

		busyOp(
			async () => {
				await addFeedGroup(addGroupData);
				addGroupData.name = "";
			},
			"Unable to add group",
			"Group added",
		);
	}

	// Rename an existing group
	async function handleRenameGroup() {}

	// Refresh a feed
	async function handleRefreshFeed(feedId: FeedId) {
		busyOp(
			() => refreshFeed(feedId),
			"There was a problem refreshing the feed",
			"Feed refreshed!",
		);
	}

	$: groups = feedGroups.reduce(
		(acc, group) => {
			for (const id of group.feed_ids) {
				acc[id] = group.id;
			}
			return acc;
		},
		{} as Record<FeedId, FeedGroupId>,
	);

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
	<Dialog title="Manage Feeds" {onClose} {busy}>
		<!-- manage feeds -->
		<div class="feeds flex w-full">
			<!-- scroller -->
			<div
				class={`
					grid
					flex-1
					grid-cols-1
					overflow-auto
					px-3
					md:grid-cols-2
					md:divide-x
					md:divide-black/10
				`}
			>
				<section class="flex flex-col pb-3 pt-2 md:overflow-auto md:pr-3">
					<h4>Feeds</h4>
					<ul class="flex w-full flex-col divide-y divide-black/10">
						{#each sortedFeeds as feed (feed.id)}
							<!-- feed -->
							<li class="flex flex-col gap-1 py-2">
								<!-- feed title -->
								<h6 class="truncate">{feed.title}</h6>
								<!-- feed URL -->
								<span class="truncate italic">{feed.url}</span>
								<!-- controls -->
								<div class="mt-1 flex flex-row gap-2">
									<Select
										class="flex-auto"
										value={groups[feed.id] ?? "not subscribed"}
										on:change={(event) => {
											const value = getEventValue(event);
											if (value) {
												if (value === "not subscribed") {
													handleRemoveFeed(feed.id);
												} else {
													handleMoveFeed({ feedId: feed.id, groupId: value });
												}
											}
										}}
									>
										<option value="not subscribed">Not subscribed</option>
										{#each feedGroups as group (group.id)}
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
							</li>
						{/each}
					</ul>
				</section>

				<!-- update form -->
				<section class="flex flex-col gap-2 pb-3 pt-2 md:overflow-auto md:pl-3">
					<form
						on:submit|preventDefault={handleAddFeed}
						class="flex flex-col gap-1"
					>
						<h4>Add Feed</h4>
						<div class="flex flex-row gap-2">
							<Input
								bind:value={addFeedData.url}
								placeholder="https://..."
								class="flex-auto"
							/>
							<Button type="submit">Save</Button>
						</div>
					</form>

					<form
						on:submit|preventDefault={handleUpdateFeedUrl}
						class="flex flex-col gap-1 overflow-hidden"
					>
						<h4>Update Feed URL</h4>
						<div class="flex flex-row gap-2 overflow-hidden">
							<Select
								class="flex-1"
								value={updateFeedUrlData.feedId}
								on:change={(event) => {
									updateFeedUrlData.feedId = getEventValue(event) ?? "";
									const feed = feeds.find(
										({ id }) => id === updateFeedUrlData.feedId,
									);
									updateFeedUrlData.url = feed?.url ?? "";
								}}
							>
								{#each feeds as feed (feed.id)}
									<option value={feed.id}>{feed.title}</option>
								{/each}
							</Select>
							<Input
								class="flex-1"
								value={updateFeedUrlData.url}
								on:change={(event) => {
									updateFeedUrlData.url = getEventValue(event) ?? "";
								}}
								placeholder="https://..."
							/>
							<Button type="submit">Save</Button>
						</div>
					</form>

					<form
						on:submit|preventDefault={handleUpdateFeedTitle}
						class="flex flex-col gap-1"
					>
						<h4>Update Feed Title</h4>
						<div class="flex flex-row gap-2">
							<Select
								class="flex-1"
								value={updateFeedTitleData.feedId}
								on:change={(event) => {
									updateFeedTitleData.feedId = getEventValue(event) ?? "";
									const feed = feeds.find(
										({ id }) => id === updateFeedTitleData.feedId,
									);
									updateFeedTitleData.title = feed?.title ?? "";
								}}
							>
								{#each feeds as feed (feed.id)}
									<option value={feed.id}>{feed.title}</option>
								{/each}
							</Select>
							<Input
								class="flex-1"
								value={updateFeedTitleData.title}
								on:change={(event) => {
									updateFeedTitleData.title = getEventValue(event) ?? "";
								}}
								placeholder="https://..."
							/>
							<Button type="submit">Save</Button>
						</div>
					</form>

					<form
						on:submit|preventDefault={handleAddGroup}
						class="flex flex-col gap-1"
					>
						<h4>Add Group</h4>
						<div class="flex flex-row gap-2">
							<Input
								bind:value={addGroupData.name}
								placeholder="Applications"
								class="flex-auto"
							/>
							<Button type="submit">Save</Button>
						</div>
					</form>

					<form
						on:submit|preventDefault={handleRenameGroup}
						class="flex flex-col gap-1"
					>
						<h4>Rename Group</h4>
						<div class="flex flex-row gap-2">
							<Select bind:value={renameGroupData.feedGroupId} class="flex-1">
								{#each feedGroups as group (group.id)}
									<option value={group.id}>{group.name}</option>
								{/each}
							</Select>
							<Input
								bind:value={renameGroupData.name}
								placeholder="Applications"
								class="flex-1"
							/>
							<Button type="submit">Save</Button>
						</div>
					</form>
				</section>
			</div>
		</div>
	</Dialog>
</Portal>
