<script lang="ts">
	let errors: {
		username?: string;
		password?: string;
	} = {};
</script>

<section class="login">
	<form method="post" action="/api/login">
		<input name="username" placeholder="Username" />
		<input
			name="password"
			placeholder="Password"
			type="password"
		/>
		<button type="submit">Login</button>

		{#if errors.username}
			<div id="username-error">{errors.username}</div>
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
