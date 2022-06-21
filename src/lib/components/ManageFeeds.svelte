<script type="ts">
  import { session } from '$app/stores';
  import { post } from '$lib/util';
  import Dialog from './Dialog.svelte';
  import Portal from './Portal.svelte';
  import Select from './Select.svelte';
  import type { Feed } from '@prisma/client';
  import { onMount } from 'svelte';

  export let onClose: (() => void) | undefined = undefined;

  const user = $session.user;

  let feeds: Feed[] = [];

  const groups = user.feedGroups;
  const feedGroups: { [feedId: string]: string } = {};
  for (const group of groups) {
    for (const feedGroup of group.feeds) {
      feedGroups[feedGroup.feed.id] = group.id;
    }
  }

  let busy = false;
  let feedUrl: string = '';

  async function addFeed() {
    busy = true;
    try {
      await post('/api/feeds', { url: feedUrl });
    } catch (error) {
      console.warn(error);
    }
    busy = false;
  }

  onMount(() => {
    fetch('/api/feeds')
      .then((resp) => resp.json())
      .then((allFeeds: Feed[]) => {
        feeds = allFeeds.sort((a, b) => {
          if (a.title === b.title) {
            return 0;
          }
          if (a.title > b.title) {
            return 1;
          }
          return -1;
        });
      });
  });
</script>

<Portal anchor="modal">
  <Dialog title="Manage Feeds" {onClose} {busy}>
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
                    <Select value={feedGroups[feed.id] ?? 'not subscribed'}>
                      <option value="not subscribed">Not subscribed</option>
                      {#each groups as group (group.id)}
                        <option value={group.id}>{group.name}</option>
                      {/each}
                    </Select>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </section>

        <section>
          <h3>Add Feed</h3>
          <form on:submit|preventDefault={addFeed}>
            <input bind:value={feedUrl} placeholder="https://..." />
            <button>Save</button>
          </form>

          <h3>Add Group</h3>
          <form>
            <input name="group-name" placeholder="Applications" />
            <button>Save</button>
          </form>

          <h3>Rename Group</h3>
          <form>
            <Select value={groups[0].id}>
              {#each groups as group (group.id)}
                <option value={group.id}>{group.name}</option>
              {/each}
            </Select>
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
    padding: 1em;
    flex-grow: 1;
  }

  section {
    box-sizing: border-box;
    padding: 1em;
    display: flex;
    flex-direction: column;
    gap: 1em;
    overflow: auto;
  }

  section:first-child {
    border-right: solid 1px var(--border);
    padding-right: 2em;
  }

  section:last-child {
    padding-left: 2em;
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

    section:first-child {
      border-right: none;
      padding-right: 1em;
    }

    section:last-child {
      padding-left: 1em;
    }

    .scroller {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      flex-shrink: 0;
      padding: 1em;
    }
  }
</style>
