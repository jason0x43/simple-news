<script type="ts">
  export let href: string;
  export let type: 'normal' | 'invisible' = 'normal';
</script>

<a {href} {...$$restProps} class:invisible={type === 'invisible'}><slot /></a>

<style>
  a {
    cursor: pointer;
    display: flex;
    align-items: center;
  }

  .invisible {
    text-decoration: none;
    color: inherit;
  }
</style>
