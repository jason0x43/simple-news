<script lang="ts">
  import { getAppContext } from '$lib/contexts';
  import { onMount } from 'svelte';

  const context = getAppContext();

  export let target: HTMLElement | null | undefined = undefined;
  export let x = 0;
  export let y = 0;

  let ref: HTMLElement;

  onMount(() => {
    const elem = target ?? context.getRoot() ?? globalThis.document?.body;
    elem?.append(ref);
  });
</script>

<div class="portal" bind:this={ref} style={`top:${y}px;left:${x}px`}>
  <slot />
</div>

<style>
  .portal {
    position: absolute;
    z-index: 200;
  }
</style>
