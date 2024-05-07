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
			rounded-sm
			border
			border-black/20
			bg-white
			text-black
			shadow-md
			dark:border-white/20
			dark:bg-black
			dark:text-white
		`}
		bind:this={ref}
	>
		{#each items as item}
			<li
				role="menuitem"
				on:click={handleItemClick}
				on:keypress={handleItemClick}
				on:touchend={handleItemClick}
				data-value={item.value}
				class={`
					cursor-pointer
					select-none
					whitespace-nowrap
					p-3
					hover:bg-gray-x-light
					active:bg-gray-x-light
					dark:hover:bg-gray-x-dark
					dark:active:bg-gray-x-dark
				`}
			>
				{item.label ?? item.value}
			</li>
		{/each}
	</ul>
</Portal>
