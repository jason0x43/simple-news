<script type="ts">
  import { session } from '$app/stores';

  import Dialog from './Dialog.svelte';
  import Portal from './Portal.svelte';

  export let onClose: (() => void) | undefined = undefined;

  let user = $session.user;
</script>

<Portal anchor="modal">
  <Dialog title="Add Feed" {onClose}>
    <div class="add-feed">
      <form>
        <label>URL: <input /></label>
        <label
          >Group: <select>
            {#each user.feedGroups as group}
              <option value={group.id}>{group.name}</option>
            {/each}
          </select>
        </label>
      </form>
    </div>
  </Dialog>
</Portal>

<style>
  .add-feed {
    width: 200px;
    padding: 1em;
  }
</style>
