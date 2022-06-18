<script type="ts">
  import Button from './Button.svelte';

  export let size: 'small' | 'large' | 'normal' = 'normal';
  export let options: { label: string; value: string }[];
  export let selected: string;
  export let onSelect: (value: string) => void;
</script>

<div class="ButtonSelector">
  {#each options as opt (opt.value)}
    <Button
      key={opt.value}
      class={selected === opt.value ? 'selected' : ''}
      {size}
      on:click={() => onSelect(opt.value)}
    >
      {opt.label}
    </Button>
  {/each}
</div>
