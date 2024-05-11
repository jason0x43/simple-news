<script lang="ts">
	import { fade } from "svelte/transition";
	import { toasts } from "../toast";
	import Portal from "./Portal.svelte";
</script>

<Portal anchor={{ y: 10 }} zIndex={55}>
	<ul class="list-none flex flex-col gap-4" >
		{#each $toasts as toast}
			<li
				class="border border-gray-x-light bg-white px-4 py-1 rounded-md"
				class:bg-green={toast.type === "good"}
				class:border-green-dark={toast.type === "good"}
				class:bg-red={toast.type === "bad"}
				class:border-red-dark={toast.type === "bad"}
				class:text-white={toast.type === "bad" || toast.type === "good"}
				in:fade={{ duration: 250 }}
				out:fade={{ duration: 250 }}
			>
				{toast.message}
			</li>
		{/each}
	</ul>
</Portal>
