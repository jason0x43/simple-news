<script lang="ts">
  import { getAppContext } from '$lib/contexts';
  import { onMount } from 'svelte';

  const context = getAppContext();

  export let target: HTMLElement | null | undefined = undefined;
  export let anchor: { x: number; y: number } | 'modal' | undefined = undefined;

  let ref: HTMLElement;
  let style: string | undefined;

  $: {
    if (anchor && typeof anchor === 'object') {
      style = `top:${anchor.y}px;left:${anchor.x}px`;
    } else if (!anchor) {
      style = `top:50%;left:50%;transform:translate(-50%,-50%)`;
    } else {
      style = undefined;
    }
  }

  onMount(() => {
    const elem = target ?? context.getRoot() ?? globalThis.document?.body;
    elem?.append(ref);
  });
</script>

<div class="portal" class:modal={anchor === 'modal'} bind:this={ref} {style}>
  <slot />
</div>

<style>
  .portal {
    position: absolute;
    z-index: 200;
  }

  .modal {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(128, 128, 128, 0.85);
  }
</style>
