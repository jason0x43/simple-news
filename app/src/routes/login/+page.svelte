<script lang="ts">
	let next: string | undefined;
	let errors: string | undefined;
</script>

<main class="login">
	<form method="post">
		<input name="username" placeholder="Username" />
		<input name="password" placeholder="Password" type="password" />
		{#if next}<input name="next" type="hidden" value={next} />{/if}
		<button type="submit">Login</button>

		{#if errors}
			<div class="error">{errors}</div>
		{/if}
	</form>
</main>

<style>
	.login {
		position: fixed;
		height: 100%;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	form {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		background: #d0d0d0;
		padding: 1rem;
		border-radius: 0.375rem;
	}

	input {
		font-size: 100%;
		padding: 0.5rem;
		border: none;
		border-radius: 0.375rem;
		line-height: inherit;
	}

	button {
		font-size: 100%;
		line-height: inherit;
		border: none;
		background: transparent;
		padding: 0;
	}

	@media (prefers-color-scheme: dark) {
		form {
			background: #444;
		}

		button {
			color: white;
		}
	}
</style>
