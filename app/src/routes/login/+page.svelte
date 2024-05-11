<script lang="ts">
	import Input from "$lib/components/Input.svelte";
	import Button from "$lib/components/Button.svelte";
	import { enhance } from "$app/forms";
	import { page } from "$app/stores";
	import { showToast } from "$lib/toast";
	import Toast from "$lib/components/Toast.svelte";
	import { onMount } from "svelte";
	import { cls } from "$lib/cls";
	import { fade } from "svelte/transition";

	let ready = false;
	let username = "";
	let password = "";
	let inputRef: HTMLInputElement;

	$: {
		if ($page.form?.invalid) {
			handleInvalid();
		}
	}

	function handleInvalid() {
		showToast("Invalid username and/or password", {
			type: "bad",
			duration: 2000,
		});
		username = "";
		password = "";

		inputRef.focus();
	}

	onMount(() => {
		ready = true;
	});
</script>

<Toast />

{#if ready}
	<div class="absolute-center" in:fade={{ duration: 250 }}>
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
				<Input
					name="username"
					placeholder="Username"
					bind:ref={inputRef}
					bind:value={username}
				/>
				<Input
					name="password"
					placeholder="Password"
					type="password"
					bind:value={password}
				/>
			</div>
			<Button disabled={!username || !password} type="submit">Login</Button>
		</form>
	</div>
{/if}
