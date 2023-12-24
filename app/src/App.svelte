<script lang="ts">
	import "./app.css";
	import { init as initRouter } from "./lib/router";
	import ArticlesList from "./lib/components/ArticlesList.svelte";
	import Header from "./lib/components/Header.svelte";
	import Sidebar from "./lib/components/Sidebar.svelte";
	import {
		sidebarVisible,
		init as initState,
		article,
		feed,
		feedId,
		managingFeeds,
		user,
		loadData,
	} from "./lib/state";
	import { setAppContext } from "./lib/context";
	import { readonly, writable } from "svelte/store";
	import ArticleView from "./lib/components/ArticleView.svelte";
	import FeedManager from "./lib/components/FeedManager.svelte";
	import { login } from "./lib/api";

	initRouter();
	initState();

	let rootRef: HTMLElement | undefined;
	const root = writable<HTMLElement>();
	setAppContext("root", readonly(root));

	$: {
		if (rootRef) {
			$root = rootRef;
		}
	}

	async function handleLogin(event: Event) {
		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);
		const data = {
			username: `${formData.get("username")}`,
			password: `${formData.get("password")}`,
		};
		try {
			await login(data);
			window.location.href = "/";
		} catch (error) {
			console.error(`Error logging in: ${error}`);
		}
	}
</script>

{#if $user}
	<div
		class={`
		fixed
		top-0
		left-0
		bottom-0
		right-0
		flex
		flex-col
		overflow-hidden
	`}
		bind:this={rootRef}
	>
		<Header />

		<div
			class={`
		h-full
		max-w-full
		overflow-y-auto
		overflow-x-hidden
		relative
		bg-white
		dark:bg-black
		flex
		flex-row
	`}
		>
			{#if $feedId}
				<ArticlesList />
			{/if}

			{#if $sidebarVisible}
				<Sidebar />
			{/if}

			{#if article && feed}
				<ArticleView />
			{/if}

			{#if $managingFeeds}
				<FeedManager />
			{/if}
		</div>
	</div>
{:else}
	<div class="flex flex-row items-center justify-center h-screen bg-white dark:bg-black">
		<form
			method="post"
			on:submit|preventDefault={handleLogin}
			class="flex flex-col p-4 gap-4 bg-gray-dark rounded-md"
		>
			<input
				name="username"
				placeholder="Username"
				class="p-2 border rounded-md border-none dark:bg-gray"
			/>
			<input
				name="password"
				placeholder="Password"
				type="password"
				class="p-2 border rounded-md border-none dark:bg-gray"
			/>
			<button class="dark:text-white" type="submit">Login</button>
		</form>
	</div>
{/if}
