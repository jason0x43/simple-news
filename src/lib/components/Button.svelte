<script type="ts">
  export let size: 'small' | 'normal' | 'large';
</script>

<button
  class={`button ${$$props.class}`}
  class:large={size === 'large'}
  class:small={size === 'small'}
  on:click
  {...$$restProps}
>
  <slot />
</button>

<style>
  .button {
    background: var(--matte);
    color: var(--foreground);
    font-size: var(--font-size);
    padding: 0.5em 1em 0.7em 1em;
    border: solid 1px var(--border);
    border-radius: var(--border-radius);
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
  }

  .button:active {
    background: var(--active-matte);
  }

  .button:disabled {
    opacity: 0.5;
  }

  .large {
    padding: 0.75em 1em;
    font-size: var(--font-size);
  }

  .small {
    margin: 0.25em 0.5em;
    padding: 0.25em 0.5em;
    font-size: calc(var(--font-size) * 0.75);
  }

  @media (hover: hover) {
    .button:hover {
      background: var(--hover-matte);
    }
  }
</style>
