<script lang="ts">
	import { login } from "../state";

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

<div class="flex flex-row items-center justify-center h-screen">
	<form
		method="post"
		on:submit|preventDefault={handleLogin}
		class="flex flex-col p-4 gap-4 bg-gray dark:bg-gray-dark rounded-md"
	>
		<input
			name="username"
			placeholder="Username"
			autocomplete="off"
			autocapitalize="off"
			class="p-2 border rounded-md border-none"
		/>
		<input
			name="password"
			placeholder="Password"
			type="password"
			autocomplete="off"
			class="p-2 border rounded-md border-none"
		/>
		<button class="dark:text-white" type="submit">Login</button>
	</form>
</div>
