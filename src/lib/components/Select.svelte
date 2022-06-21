<script type="ts">
  import { createEventDispatcher } from 'svelte';

  export let value: string;
  const dispatch = createEventDispatcher();

  function handleChange(event: Event & { currentTarget: HTMLSelectElement }) {
    dispatch('change', { value: event.currentTarget.value });
  }
</script>

<div class="select">
  <select bind:value on:change={handleChange}>
    <slot />
  </select>
</div>

<style>
  .select {
    position: relative;
    display: flex;
    align-items: center;
    background: var(--hover-matte);
    border-radius: var(--border-radius);
    border: solid 1px var(--border);
  }

  .select select {
    appearance: none;
    border: none;
    background: transparent;
    color: var(--foreground);
    font-size: var(--font-size);
    margin: 0;
    padding: 4px 1.8em 4px 6px;
  }

  .select::after {
    background-color: var(--foreground);
    clip-path: polygon(100% 0%, 0 0%, 50% 100%);
    content: '';
    height: 0.5em;
    pointer-events: none;
    position: absolute;
    right: 6px;
    width: 0.7em;
  }
</style>
