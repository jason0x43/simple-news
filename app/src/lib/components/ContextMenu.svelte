<script lang="ts">
	import { isActionEvent } from "../util";
	import Portal from "./Portal.svelte";

	export let items: { label?: string; value: string }[];
	export let anchor: { x: number; y: number };
	export let onSelect: (value: string) => void | Promise<void>;
	export let onClose: () => void;

	let ref: HTMLUListElement;

	function handleClick(event: MouseEvent) {
		if (!event.target || !ref.contains(event.target as HTMLElement)) {
			onClose();
		}
	}

	async function handleItemClick(
		event: Event & { currentTarget: EventTarget & HTMLLIElement },
	) {
		if (isActionEvent(event)) {
			const value = event.currentTarget.getAttribute("data-value") as string;
			try {
				await onSelect(value);
			} catch (error) {
				console.warn(`Error selecting item: ${error}`);
			}
			onClose();
		}
	}
</script>

<svelte:body on:click|capture={handleClick} />

<Portal {anchor}>
	<ul
		class={`
			bg-white
			dark:bg-black
			text-black
			dark:text-white
			border
			border-black/20
			dark:border-white/20
			rounded-sm
			shadow-md
		`}
		bind:this={ref}
	>
		{#each items as item}
			<li
				role="menuitem"
				on:click={handleItemClick}
				on:keypress={handleItemClick}
				data-value={item.value}
				class={`
					hover:bg-gray-x-light
					dark:hover:bg-gray-x-dark
					p-3
					cursor-pointer
					whitespace-nowrap
					select-none
				`}
			>
				{item.label ?? item.value}
			</li>
		{/each}
	</ul>
</Portal>
