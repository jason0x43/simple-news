<script type="ts">
  export let type: 'normal' | 'invisible' = 'normal';
</script>

<button on:click {...$$props} class:invisible={type === 'invisible'}>
  <slot />
</button>

<style>
  .invisible {
    border: none;
    background: none;
    padding: 0;
  }

  :not(:disabled) {
    cursor: pointer;
  }
</style>
