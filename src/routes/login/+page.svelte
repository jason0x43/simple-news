<script lang="ts">
	// import type { ActionData } from './$types';

	// export let form: ActionData;
	export let form: Record<string, unknown> | undefined;

	let username = '';
	let password = '';
</script>

<section class="login">
	<form method="post">
		<input name="username" placeholder="Username" bind:value={username} />
		<input
			name="password"
			placeholder="Password"
			type="password"
			bind:value={password}
		/>
		<button type="submit">Login</button>

		{#if form?.username}
			<div id="username-error">{form.username}</div>
		{/if}

		{#if form?.password}
			<div id="password-error">{form.password}</div>
		{/if}
	</form>
</section>

<style>
	.login {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	form {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--gap);
	}
</style>
