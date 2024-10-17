<script lang="ts">
	import { fade } from "svelte/transition";
	import { toasts } from "../toast";
	import Portal from "./Portal.svelte";
</script>

<Portal anchor={{ y: 20 }} zIndex={55}>
	<ul class="flex list-none flex-col gap-4">
		{#each $toasts as toast}
			<li
				class="rounded-md border px-4 py-1"
				class:normal={toast.type === "normal"}
				class:good={toast.type === "good"}
				class:bad={toast.type === "bad"}
				in:fade={{ duration: 250 }}
				out:fade={{ duration: 250 }}
			>
				{toast.message}
			</li>
		{/each}
	</ul>
</Portal>

<style lang="postcss">
	.normal {
		@apply border-border-light
			bg-hover-light
			dark:border-border-dark
			dark:bg-hover-dark;
	}

	.good {
		@apply border-green-dark bg-green text-white;
	}

	.bad {
		@apply border-red-dark/50 bg-red/50 text-white;
	}
</style>
