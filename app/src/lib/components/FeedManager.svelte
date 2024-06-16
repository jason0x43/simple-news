<script lang="ts">
	import Button from "./Button.svelte";
	import Dialog from "./Dialog.svelte";
	import Portal from "./Portal.svelte";
	import Select from "./Select.svelte";
	import Input from "./Input.svelte";
	import { showToast } from "../toast";
	import { seconds } from "../util";
	import Refresh from "../icons/Refresh.svelte";
	import Save from "../icons/Save.svelte";
	import Edit from "../icons/Edit.svelte";
	import {
		addFeed,
		addFeedGroup,
		addGroupFeed,
		refreshFeed,
		removeFeedFromAllGroups,
		updateFeed,
	} from "$lib/api";
	import Close from "$lib/icons/Close.svelte";
	import type {
		Feed,
		FeedGroupId,
		FeedGroupWithFeeds,
		FeedId,
	} from "simple-news-types";

	export let feedGroups: FeedGroupWithFeeds[];
	export let feeds: Feed[];
	export let onClose: () => void;

	let busy = false;
	let addFeedData = { url: "", title: "" };
	let addGroupData = { name: "" };
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

	// Add a new feed
	async function handleAddFeed() {
		busyOp(() => addFeed(addFeedData), "Unable to add feed", "Feed added");
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

	let editing = "";

	async function handleSubmit(event: SubmitEvent) {
		const form = event.target as HTMLFormElement;
		const value = new FormData(form);
		const id = editing;
		const title = value.get("title") as string;
		const url = value.get("url") as string;
		const groupId = value.get("group") as string;

		await busyOp(
			() =>
				Promise.all([
					updateFeed(id, { title, url }),
					groupId === "not subscribed"
						? removeFeedFromAllGroups(id)
						: addGroupFeed(groupId, { feed_id: id as FeedId, move_feed: true }),
				]),
			"Unable to update feed",
			"Feed updated",
		);

		editing = "";
	}
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
					md:divide-border-light
					md:dark:divide-border-dark
				`}
			>
				<section class="flex flex-col pb-3 pt-2 md:overflow-auto md:pr-3">
					<h4>Feeds</h4>
					<ul
						class={`
							flex
							w-full
							flex-col
							divide-y
							divide-border-light
							dark:divide-border-dark
						`}
					>
						{#each sortedFeeds as feed (feed.id)}
							<!-- feed -->
							<li class="flex flex-row gap-4 py-2">
								<form
									class="flex flex-grow flex-row gap-3 overflow-hidden"
									on:submit|preventDefault={handleSubmit}
								>
									<div class="flex flex-grow flex-col gap-1">
										<!-- feed title -->
										<Input
											name="title"
											variant="editable"
											disabled={editing !== feed.id}
											value={feed.title}
											class="flex-grow-0 font-bold"
										/>

										<!-- feed URL -->
										<Input
											name="url"
											variant="editable"
											disabled={editing !== feed.id}
											value={feed.url}
										/>

										<!-- feed group -->
										<Select
											name="group"
											variant="editable"
											disabled={editing !== feed.id}
											value={groups[feed.id] ?? "not subscribed"}
										>
											<option value="not subscribed">Not subscribed</option>
											{#each feedGroups as group (group.id)}
												<option value={group.id}>{group.name}</option>
											{/each}
										</Select>
									</div>

									<div class="flex flex-col gap-1">
										<Button
											disabled={editing !== "" && editing !== feed.id}
											on:click={() => {
												if (editing === feed.id) {
													editing = "";
												} else {
													editing = feed.id;
												}
											}}
											class="flex-grow"
										>
											{#if editing === feed.id}
												<Close size="1.25em" />
											{:else}
												<Edit size="1.25em" />
											{/if}
										</Button>

										<Button
											disabled={editing !== "" && editing !== feed.id}
											type={editing === feed.id ? "submit" : "button"}
											on:click={() => {
												if (editing !== feed.id) {
													handleRefreshFeed(feed.id);
												}
											}}
											class="flex-grow"
										>
											{#if editing === feed.id}
												<Save size="1.25em" />
											{:else}
												<Refresh size="1.25em" />
											{/if}
										</Button>
									</div>
								</form>
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
							<Button type="submit"><Save size="1.25em" /></Button>
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
							<Button type="submit"><Save size="1.25em" /></Button>
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
							<Button type="submit"><Save size="1.25em" /></Button>
						</div>
					</form>
				</section>
			</div>
		</div>
	</Dialog>
</Portal>
