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
      <div class="scroller">
        <section>
          <h3>Feeds</h3>
          <div class="list-wrapper">
            <div class="table">
              {#each feeds as feed (feed.id)}
                <div class="row">
                  <div class="feed">
                    {feed.title}
                    <div class="feed-url">{feed.url}</div>
                  </div>
                  <div>
                    <select value={feedGroups[feed.id]}>
                      <option value="not subscribed">Not subscribed</option>
                      {#each groups as group (group.id)}
                        <option value={group.id}>{group.name}</option>
                      {/each}
                    </select>
                  </div>
                </div>
              {/each}
            </div>
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
            <button>Save</button>
          </form>

          <h3>Rename Group</h3>
          <form>
            <select>
              {#each groups as group (group.id)}
                <option value={group.id}>{group.name}</option>
              {/each}
            </select>
            <input name="group-name" placeholder="Applications" />
            <button>Save</button>
          </form>
        </section>
      </div>
    </div>
  </Dialog>
</Portal>

<style>
  .manage-feeds {
    display: flex;
  }

  .scroller {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1em;
    padding: 1em;
    flex-grow: 1;
  }

  section {
    border: solid 1px #eee;
    border-radius: var(--border-radius);
    box-sizing: border-box;
    padding: 1em;
    display: flex;
    flex-direction: column;
    gap: 1em;
    overflow: auto;
  }

  h3 {
    margin: 0;
  }

  .list-wrapper {
    overflow: auto;
    display: flex;
  }

  form {
    display: flex;
    gap: var(--gap);
  }

  input {
    flex-grow: 1;
    min-width: 1em;
  }

  .feed-url {
    font-style: italic;
    font-size: 90%;
    margin-top: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .table {
    display: grid;
    grid-template-columns: 1fr min-content;
    grid-auto-rows: min-content;
    width: 100%;
  }

  .row {
    display: contents;
  }

  .row > * {
    border-bottom: solid 1px var(--border);
    white-space: nowrap;
    text-overflow: ellipsis;
    padding: 0.5em 0;
  }

  .row:last-child > * {
    border-bottom: none;
    padding-bottom: none;
  }

  .feed {
    overflow: hidden;
    padding-right: 1em;
  }

  /* Mobile */
  @media only screen and (max-width: 800px) {
    .manage-feeds {
      display: flex;
      flex-direction: column;
      overflow: auto;
    }

    .scroller {
      display: flex;
      flex-direction: column;
      gap: 1em;
      flex-grow: 1;
      flex-shrink: 0;
      padding: 1em;
    }
  }
</style>
