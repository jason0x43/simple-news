<script type="ts">
  import Portal from './Portal.svelte';
  import Dialog from './Dialog.svelte';

  export let items: { label?: string; value: string }[];
  export let anchor: { x: number; y: number };
  export let onSelect: (value: string) => void;
  export let onClose: () => void;

  let ref: HTMLUListElement;

  function handleClick(event: MouseEvent) {
    if (!event.target || !ref.contains(event.target as HTMLElement)) {
      onClose();
    }
  }

  function handleItemClick(
    event: MouseEvent & { currentTarget: EventTarget & HTMLLIElement }
  ) {
    const value = event.currentTarget.getAttribute('data-value') as string;
    onSelect(value);
    onClose();
  }
</script>

<svelte:window on:click={handleClick} />

<Portal {anchor}>
  <ul class="contextmenu" bind:this={ref}>
    {#each items as item}
      <li on:click={handleItemClick} data-value={item.value}>
        {item.label ?? item.value}
      </li>
    {/each}
  </ul>
</Portal>

<style>
  .contextmenu {
    background: var(--background);
    border: solid 1px var(--border);
    border-radius: var(--border-radius);
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);
    color: var(--foreground);
    list-style-type: none;
    padding: 0;
    margin: 0;
    min-width: 100px;
  }

  li {
    padding: 0.5rem;
    cursor: pointer;
    white-space: nowrap;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
  }

  @media (hover: hover) {
    li:hover {
      background: var(--matte);
    }
  }
</style>
