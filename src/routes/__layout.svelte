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
  @font-face {
    font-family: 'Merriweather';
    src: url('/fonts/Merriweather-Black.woff2') format('woff2');
    font-weight: 900;
    font-style: normal;
  }
  @font-face {
    font-family: 'Merriweather';
    src: url('/fonts/Merriweather-BlackItalic.woff2') format('woff2');
    font-weight: 900;
    font-style: italic;
  }
  @font-face {
    font-family: 'Merriweather';
    src: url('/fonts/Merriweather-Bold.woff2') format('woff2');
    font-weight: bold;
    font-style: normal;
  }
  @font-face {
    font-family: 'Merriweather';
    src: url('/fonts/Merriweather-BoldItalic.woff2') format('woff2');
    font-weight: bold;
    font-style: italic;
  }
  @font-face {
    font-family: 'Merriweather';
    src: url('/fonts/Merriweather-Italic.woff2') format('woff2');
    font-weight: normal;
    font-style: italic;
  }
  @font-face {
    font-family: 'Merriweather';
    src: url('/fonts/Merriweather-Light.woff2') format('woff2');
    font-weight: 300;
    font-style: normal;
  }
  @font-face {
    font-family: 'Merriweather';
    src: url('/fonts/Merriweather-LightItalic.woff2') format('woff2');
    font-weight: 300;
    font-style: italic;
  }
  @font-face {
    font-family: 'Merriweather';
    src: url('/fonts/Merriweather-Regular.woff2') format('woff2');
    font-weight: normal;
    font-style: normal;
  }

  :global(body),
  :global(html) {
    padding: 0;
    margin: 0;
    min-height: 100vh;
    min-height: -webkit-fill-available;
    background: black;
    color: white;
    -webkit-text-size-adjust: none;
    text-size-adjust: none;
  }

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
      --matte: #222;
      --hover-matte: #444;
      --active-matte: #555;
      --surface: #666;
      --background: black;
      --foreground: #ddd;
      --border: rgba(255, 255, 255, 0.2);
      --selected: rgba(255, 2550, 255, 0.2);
      --link: #77f;
    }
  }

  :global(*:focus) {
    outline: none;
  }

  :global(a) {
    color: var(--link);
  }

  :global(input) {
    background: var(--hover-matte);
    border: solid 1px var(--border);
    border-radius: var(--border-radius);
    font-size: var(--font-size);
    color: var(--foreground);
    margin: 0;
    padding: 4px;
  }

  :global(button) {
    background: var(--hover-matte);
    border: solid 1px var(--border);
    border-radius: var(--border-radius);
    color: var(--foreground);
    font-size: var(--font-size);
    padding: 4px 6px;
    margin: 0;
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
