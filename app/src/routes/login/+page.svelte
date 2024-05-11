<script lang="ts">
	import Input from "$lib/components/Input.svelte";
	import Button from "$lib/components/Button.svelte";
	import { enhance } from "$app/forms";
	import { page } from "$app/stores";
	import { showToast } from "$lib/toast";
	import Toast from "$lib/components/Toast.svelte";
	import { onMount } from "svelte";
	import { cls } from "$lib/cls";

	$: {
		if ($page.form?.invalid) {
			showToast("Invalid username and/or password", {
				type: "bad",
				duration: 2000,
			});
		}
	}

	let ready = false;

	$: console.log("ready:", ready);

	onMount(() => {
		setTimeout(() => {
			ready = true;
		});
	});
</script>

<Toast />

<div
	class="absolute-center transition-opacity"
	class:opacity-0={!ready}
	class:opacity-1={ready}
>
	<form
		method="POST"
		class={cls`
			flex
			flex-col
			items-center
			gap-4
			rounded-md
			border
			border-border-light
			p-4
			dark:border-border-dark
		`}
		use:enhance
	>
		<div class="flex flex-col gap-2">
			<Input name="username" placeholder="Username" />
			<Input name="password" placeholder="Password" type="password" />
		</div>
		<Button type="submit">Login</Button>
	</form>
</div>
