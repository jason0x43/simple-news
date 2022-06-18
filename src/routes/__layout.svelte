<script type="ts">
  import { onMount } from 'svelte';
  import { displayType } from '$lib/stores';

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

<slot />
