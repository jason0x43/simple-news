<script type="ts">
  import Portal from './Portal.svelte';
  import { toasts } from '$lib/toast';
  import { fade } from 'svelte/transition';
</script>

<Portal anchor={{ y: 10 }} zIndex={55}>
  <ul class="toasts">
    {#each $toasts as toast}
      <li
        class="toast"
        class:good={toast.type === 'good'}
        class:bad={toast.type === 'bad'}
        in:fade={{ duration: 250 }}
        out:fade={{ duration: 250 }}
      >
        {toast.message}
      </li>
    {/each}
  </ul>
</Portal>

<style>
  .toasts {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 1em;
    margin: 0;
    padding: 0;
  }

  .toast {
    border: solid 1px #ccc;
    background: white;
    padding: 0.5em 1em;
    border-radius: var(--border-radius);
    font-size: 110%;
  }

  .bad {
    background-color: #f55;
    border-color: #d22;
    color: white;
  }

  .good {
    background-color: #090;
    border-color: #080;
    color: white;
  }
</style>
