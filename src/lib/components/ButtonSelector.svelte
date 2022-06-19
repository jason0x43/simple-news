<script type="ts">
  export let options: { label: string; value: string }[];
  export let selected: string;
  export let onSelect: (value: string) => void;
</script>

<div class="ButtonSelector">
  {#each options as opt (opt.value)}
    <button
      class={selected === opt.value ? 'selected' : ''}
      on:click={() => onSelect(opt.value)}
    >
      {opt.label}
    </button>
  {/each}
</div>

<style>
  .selected {
    background: var(--active-matte);
  }

  button {
    background: var(--matte);
    color: var(--foreground);
    font-size: var(--font-size);
    border: solid 1px var(--border);
    border-radius: 0;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    margin: 0;
    padding: 0.25em 0.5em;
    font-size: calc(var(--font-size) * 0.75);
  }

  button:first-child {
    border-top-left-radius: var(--border-radius);
    border-bottom-left-radius: var(--border-radius);
  }
  button:last-child {
    border-top-right-radius: var(--border-radius);
    border-bottom-right-radius: var(--border-radius);
  }
</style>
