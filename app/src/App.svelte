<script lang="ts">
	import Login from "./lib/Login.svelte";
	import Counter from "./lib/Counter.svelte";
	import { isLoggedIn } from "./lib/auth";

	const loggedIn = isLoggedIn();
	loggedIn.then((value) => {
		console.log('logged in:', value);
	});
</script>

<div class="root">
	{#await loggedIn}
		<div>Loading...</div>
	{:then isLoggedIn}
		{#if isLoggedIn}
			<Counter />
		{:else}
			<Login />
		{/if}
	{/await}
</div>

<style>
	.root {
		position: fixed;
		height: 100%;
		width: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
</style>
