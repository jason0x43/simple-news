<script type="ts">
  import { session } from '$app/stores';
  import { getFeedsFromUser } from '$lib/util';
  import Dialog from './Dialog.svelte';
  import Portal from './Portal.svelte';

  export let onClose: (() => void) | undefined = undefined;

  const user = $session.user;
  const feeds = getFeedsFromUser(user).sort((a, b) => {
    if (a.title === b.title) {
      return 0;
    }
    if (a.title > b.title) {
      return 1;
    }
    return -1;
  });
  const groups = user.feedGroups;
  const feedGroups: { [feedId: string]: string } = {};
  for (const group of groups) {
    for (const feedGroup of group.feeds) {
      feedGroups[feedGroup.feed.id] = group.id;
    }
  }
</script>

<Portal anchor="modal">
  <Dialog title="Manage Feeds" {onClose}>
    <div class="manage-feeds">
      <section>
        <h3>Subscribed feeds</h3>
        <div class="list-wrapper">
          <table>
            <tbody>
              {#each feeds as feed (feed.id)}
                <tr>
                  <td>{feed.title}</td>
                  <td>
                    <select>
                      {#each groups as group (group.id)}
                        <option
                          value={group.id}
                          selected={feedGroups[feed.id] === group.id}
                          >{group.name}</option
                        >
                      {/each}
                    </select>
                  </td>
                </tr>
              {/each}
            </tbody><tbody />
          </table>
        </div>
      </section>

      <section>
        <h3>Add Feed</h3>
        <form>
          <input name="feed-url" placeholder="https://..." />
          <button>Save</button>
        </form>

        <h3>Add Group</h3>
        <form>
          <input name="group-name" placeholder="Applications" />
        </form>

        <h3>Rename Group</h3>
        <form>
          <select>
            {#each groups as group (group.id)}
              <option value={group.id}>{group.name}</option>
            {/each}
          </select>
          <input name="group-name" placeholder="Applications" />
        </form>
      </section>
    </div>
  </Dialog>
</Portal>

<style>
  .manage-feeds {
    padding: 1em;
    display: flex;
    flex-direction: row;
    gap: 1em;
    max-height: 75vh;
  }

  section {
    border: solid 1px #eee;
    border-radius: var(--border-radius);
    padding: 1em;
    display: flex;
    flex-direction: column;
    gap: 1em;
  }

  h3 {
    margin: 0;
  }

  .list-wrapper {
    overflow: auto;
  }

  input[name='feed-url'] {
    width: 20em;
  }
</style>
