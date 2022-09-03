<script type="ts">
  export let variant: 'normal' | 'invisible' = 'normal';
</script>

<button
  type="button"
  on:click
  {...$$restProps}
  class:invisible={variant === 'invisible'}
>
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
