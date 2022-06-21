<script type="ts">
  import CloseIcon from '$lib/icons/Close.svelte';

  export let title: string | undefined = undefined;
  export let onClose: (() => void) | undefined = undefined;
</script>

<div class="dialog">
  {#if title || onClose}
    <div class="title">
      {title}
      {#if onClose}
        <div class="close" on:click={onClose}>
          <CloseIcon size="22px" />
        </div>
      {/if}
    </div>
  {/if}
  <div class="content">
    <slot />
  </div>
</div>

<style>
  .dialog {
    background: var(--background);
    border: solid 1px var(--border);
    border-radius: var(--border-radius);
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    max-width: 80%;
    max-height: 80%;
  }

  .title {
    background: var(--active-matte);
    padding: var(--gap);
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .content {
    display: flex;
    overflow: hidden;
  }

  /* Mobile */
  @media only screen and (max-width: 800px) {
    .dialog {
      border: none;
      border-radius: 0;
      box-shadow: none;
      min-width: 100%;
      min-height: 100%;
    }
  }
</style>
