<script type="ts">
  import { onMount } from 'svelte';
  import { displayType } from '$lib/stores';
  import { setAppContext } from '$lib/contexts';

  let ref: HTMLElement;

  setAppContext({ getRoot: () => ref });

  onMount(() => {
    const matcher = globalThis.matchMedia('(max-width: 800px)');
    const listener = (event: MediaQueryListEvent) => {
      $displayType = event.matches ? 'mobile' : 'desktop';
    };
    matcher.addEventListener('change', listener);
    $displayType = matcher.matches ? 'mobile' : 'desktop';

    return () => {
      matcher.removeEventListener('change', listener);
    };
  });
</script>

<div id="root" bind:this={ref}>
  <slot />
</div>

<style>
  #root {
    --gap: 8px;
    --matte: #f7f7f7;
    --hover-matte: #f0f0f0;
    --active-matte: #e0e0e0;
    --surface: #e7e7e7;
    --background: white;
    --selected: rgba(0, 0, 0, 0.1);
    --foreground: #666;
    --border: rgba(0, 0, 0, 0.15);
    --highlight: #555;
    --highlight-text: #eee;
    --link: #00f;
    --border-radius: 4px;
    --sidebar-width: 300px;
    --side-pad: 1rem;
    --font-size: 14px;

    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    font-family: sans-serif;
    font-size: var(--font-size);
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    color: var(--foreground);
    position: fixed;
    width: 100%;
    background: var(--background);
  }

  @media (prefers-color-scheme: dark) {
    #root {
      --background: black;
      --matte: #222;
      --hover-matte: #444;
      --surface: #666;
      --background: black;
      --foreground: #ddd;
      --border: rgba(255, 255, 255, 0.2);
      --selected: rgba(255, 2550, 255, 0.2);
      --link: #77f;
    }
  }

  :global(a) {
    color: var(--link);
  }

  :global(input) {
    border: solid 1px var(--border);
    border-radius: var(--border-radius);
    font-size: var(--font-size);
    padding: 4px;
  }

  :global(select) {
    appearance: none;
    background: white;
    border: solid 1px var(--border);
    border-radius: var(--border-radius);
    font-size: var(--font-size);
    padding: 4px;
  }

  :global(button) {
    border: solid 1px var(--border);
    border-radius: var(--border-radius);
    background: var(--hover-matte);
    font-size: var(--font-size);
    padding: 4px 6px;
  }

  :global(button:active) {
    background: var(--active-matte);
  }

  /* Mobile */
  @media only screen and (max-width: 800px) {
    #root {
      --sidebar-width: 100%;
      --font-size: 18px;
    }
  }
</style>
